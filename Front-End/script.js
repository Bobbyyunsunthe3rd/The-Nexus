/* ======================================
   MAIN DASHBOARD  (dashboard.html)
   Upload + parse + overview analytics.

   Parses the uploaded Excel/CSV with SheetJS
   (handling the Sell.do metadata preamble),
   stores the rows in sessionStorage.crmData,
   then renders the dashboard KPIs, chart and
   sales table. This is the SOURCE of crmData
   that every other page reads.
   See README.md > "How it works — data flow".
====================================== */

let crmData = [];
let leadChart = null;




function showNotification(title,message){


    const container =
    document.getElementById(
        "notification-container"
    );


    if(!container) return;



    const notification =
    document.createElement("div");


    notification.className =
    "dashboard-notification";


    notification.innerHTML = `

        <div class="notification-icon">
            ❗
        </div>

        <div>

            <h4>${title}</h4>

            <p>${message}</p>

        </div>

    `;


    container.appendChild(notification);



    setTimeout(()=>{


        notification.classList.add(
            "hide"
        );


        setTimeout(()=>{

            notification.remove();

        },350);



    },3500);


}




/* ======================================
   FILE UPLOAD
====================================== */


const fileInput =
document.getElementById("file-upload");


const uploadStatus =
document.getElementById("upload-status");


const uploadBtn =
document.getElementById("upload-btn");


let selectedFile = null;



fileInput.addEventListener("change", function(){


    selectedFile =
    fileInput.files[0] || null;


    if(selectedFile){

        uploadStatus.innerText =
        "Selected: " + shortenFileName(selectedFile.name);

    }

    else{

        uploadStatus.innerText =
        "No file uploaded";

    }


});




// Shortens long file names for display, e.g.
// "Q3-Real-Estate-Leads-Export-Final-v2.xlsx" -> "Q3-Real-Estate-Le....xlsx"

function shortenFileName(name, maxLength = 25){


    if(name.length <= maxLength){

        return name;

    }


    let lastDot =
    name.lastIndexOf(".");


    let extension =
    lastDot !== -1
    ? name.slice(lastDot)
    : "";


    let base =
    lastDot !== -1
    ? name.slice(0, lastDot)
    : name;


    let keep =
    Math.max(
        maxLength - extension.length - 3,
        5
    );


    return base.slice(0, keep) + "..." + extension;


}




uploadBtn.addEventListener("click", function(){


    if(!selectedFile){


        showNotification(
            "No File Selected",
            "Please choose an Excel or CSV file first."
        );


        return;

    }


    parseFile(selectedFile);


});




function parseFile(file){


    const reader =
    new FileReader();



    reader.onload = function(e){


        try{


            const data =
            new Uint8Array(e.target.result);


            const workbook =
            XLSX.read(data, {type:"array"});


            const firstSheetName =
            workbook.SheetNames[0];


            const sheet =
            workbook.Sheets[firstSheetName];


            // Some CRM exports (e.g. sell.do lead exports) include a
            // metadata preamble above the real data — export criteria,
            // date range, record count, etc. — before the actual header
            // row. Read everything as raw arrays first so we can find
            // where the real table starts.

            const rawRows =
            XLSX.utils.sheet_to_json(
                sheet,
                {header:1, defval:"N/A", blankrows:false}
            );


            // The real header row is identified by known column names
            // that should always be present in a lead export.

            const headerRowIndex =
            rawRows.findIndex(
                row =>
                row.some(
                    cell =>
                    ["Lead's Id","Lead Stage","Attended By"]
                    .includes(String(cell).trim())
                )
            );


            let rows;


            if(headerRowIndex === -1){

                // No preamble detected, fall back to a normal parse.

                rows =
                XLSX.utils.sheet_to_json(
                    sheet,
                    {defval:"N/A"}
                );

            }

            else{

                const headers =
                rawRows[headerRowIndex].map(
                    h => String(h).trim()
                );


                rows =
                rawRows
                .slice(headerRowIndex + 1)
                .map(
                    row=>{

                        let obj = {};

                        headers.forEach(
                            (h,i)=>{

                                obj[h] =
                                (row[i] === undefined || row[i] === "")
                                ? "N/A"
                                : row[i];

                            }
                        );

                        return obj;

                    }
                );

            }


            crmData = rows;


            sessionStorage.setItem(
                "crmData",
                JSON.stringify(crmData)
            );


            uploadStatus.innerText =
            `Loaded ${crmData.length} records from ${shortenFileName(file.name)}`;


            generateDashboard();


        }

        catch(err){


            console.error(
                "Error parsing file:",
                err
            );


            showNotification(
                "Upload Failed",
                "Could not read that file. Please check the format and try again."
            );


        }


    };



    reader.onerror = function(){


        showNotification(
            "Upload Failed",
            "There was a problem reading the file."
        );


    };



    reader.readAsArrayBuffer(file);


}




/* ======================================
   SHARED HELPERS
   (kept consistent with leads.js / campaigns.js)
====================================== */


function isConvertedLead(lead){


    let stage =
    String(
        lead["Lead Stage"] || ""
    )
    .toLowerCase();


    return(

        stage.includes("booked")

        ||

        stage.includes("site visit completed")

    );


}




function isQualifiedLead(lead){


    let stage =
    String(
        lead["Lead Stage"] || ""
    )
    .toLowerCase();


    return(

        stage.includes("qualified")

        ||

        stage.includes("interested")

    );


}




function isHotLead(lead){


    let hotness =
    Number(
        lead["Lead Hotness"] || 0
    );


    return hotness > 50;


}




function getCampaignName(lead){


    let campaign =

    lead["First Campaign"] ||

    lead["First-Campaign"] ||

    lead["First campaign"] ||

    "Unknown";



    campaign =
    String(campaign).trim();



    if(
        campaign === "" ||
        campaign === "N/A"
    ){

        campaign = "Unknown";

    }


    return campaign;


}




// Column names from the sell.do lead export. "Received On" is when
// the lead came in; "Created At(System Date)" is the fallback.

function getLeadDate(lead){


    let value =

    lead["Received On"] ||

    lead["Created At(System Date)"] ||

    lead["Created On"] ||

    lead["Created Date"] ||

    lead["Enquiry Date"] ||

    lead["Date"] ||

    null;


    if(!value || value === "N/A"){

        return null;

    }


    return value;


}




const MONTH_ABBR = {

    jan:0, feb:1, mar:2, apr:3,
    may:4, jun:5, jul:6, aug:7,
    sep:8, oct:9, nov:10, dec:11

};




// Parses dates like "29 Oct 2025 03:47 Pm" (the sell.do export
// format). Native Date() parsing of this format is inconsistent
// across browsers, so this is handled explicitly.

function parseLeadDate(value){


    if(!value || value === "N/A"){

        return null;

    }


    let match =
    String(value)
    .trim()
    .match(
        /^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*([AaPp][Mm]))?$/
    );


    if(!match){

        return null;

    }


    let [, day, monAbbr, year, hour, minute, meridiem] =
    match;


    let month =
    MONTH_ABBR[monAbbr.toLowerCase()];


    if(month === undefined){

        return null;

    }


    let h =
    hour ? parseInt(hour,10) : 0;


    let m =
    minute ? parseInt(minute,10) : 0;


    if(meridiem){


        let mer =
        meridiem.toLowerCase();


        if(mer === "pm" && h !== 12){

            h += 12;

        }


        if(mer === "am" && h === 12){

            h = 0;

        }


    }


    let parsed =
    new Date(
        parseInt(year,10),
        month,
        parseInt(day,10),
        h,
        m
    );


    return isNaN(parsed) ? null : parsed;


}




/* ======================================
   MAIN BUILD FUNCTIONS
====================================== */


function generateDashboard(){


    populateFilters();

    renderDashboard(crmData);


}




function renderDashboard(dataset){


    updateKPIs(dataset);

    createLeadChart(dataset);

    createSalesTable(dataset);


}




/* ======================================
   KPI CARDS
====================================== */


function updateKPIs(dataset){


    document
    .getElementById("total-leads")
    .innerText =
    dataset.length;




    let qualified =
    dataset.filter(
        lead => isQualifiedLead(lead)
    ).length;


    document
    .getElementById("qualified-leads")
    .innerText =
    qualified;




    let converted =
    dataset.filter(
        lead => isConvertedLead(lead)
    ).length;


    document
    .getElementById("conversions")
    .innerText =
    converted;




    let hot =
    dataset.filter(
        lead => isHotLead(lead)
    ).length;


    document
    .getElementById("hot-leads")
    .innerText =
    hot;


}




/* ======================================
   LEADS OVER TIME CHART
====================================== */


function createLeadChart(dataset){


    let monthly = {};


    dataset.forEach(
        lead=>{


            let raw =
            getLeadDate(lead);


            if(!raw) return;


            let d =
            parseLeadDate(raw);


            if(!d) return;


            let key =
            d.toLocaleString(
                "en-US",
                {month:"short", year:"numeric"}
            );


            monthly[key] =
            (monthly[key] || 0) + 1;


        }
    );



    let sorted =
    Object.entries(monthly)
    .sort(
        (a,b) =>
        new Date(a[0]) - new Date(b[0])
    );



    let ctx =
    document.getElementById("leadChart");


    if(leadChart){

        leadChart.destroy();

    }



    leadChart =
    new Chart(
        ctx,
        {

            type:"line",

            data:{

                labels:
                sorted.map(x => x[0]),

                datasets:[{

                    label:"Leads",

                    data:
                    sorted.map(x => x[1]),

                    borderColor:"#214268",

                    backgroundColor:"rgba(33,66,104,0.12)",

                    fill:true,

                    tension:.3

                }]

            },

            options:{

                responsive:true,

                plugins:{

                    legend:{

                        display:false

                    }

                }

            }

        }
    );


}




/* ======================================
   TOP SALESPERSON TABLE
====================================== */


function createSalesTable(dataset){


    let reps = {};


    dataset.forEach(
        lead=>{


            let name =
            String(
                lead["Attended By"] || "Unassigned"
            )
            .trim();


            if(name === "" || name === "N/A"){

                name = "Unassigned";

            }


            if(!reps[name]){

                reps[name] = {

                    qualified:0,
                    unqualified:0,
                    total:0,
                    converted:0

                };

            }


            reps[name].total++;


            if(isQualifiedLead(lead)){

                reps[name].qualified++;

            }

            else{

                reps[name].unqualified++;

            }


            if(isConvertedLead(lead)){

                reps[name].converted++;

            }


        }
    );



    let ranked =

    Object.entries(reps)

    .sort(
        (a,b) =>
        b[1].total - a[1].total
    )

    .slice(0,10);



    let tbody =
    document.getElementById("sales-table");


    tbody.innerHTML = "";



    ranked.forEach(
        ([name,data])=>{


            let conversion =

            data.total

            ?

            Math.round(
                (data.converted / data.total) * 100
            )

            :

            0;



            let row =
            document.createElement("tr");


            row.innerHTML = `

            <td>${name}</td>
            <td>${data.qualified}</td>
            <td>${data.unqualified}</td>
            <td>${conversion}%</td>

            `;


            tbody.appendChild(row);


        }
    );


}




/* ======================================
   FILTERS
====================================== */


function populateFilters(){


    let salespeople = new Set();

    let campaigns = new Set();



    crmData.forEach(
        lead=>{


            let name =
            String(
                lead["Attended By"] || ""
            )
            .trim();


            if(name && name !== "N/A"){

                salespeople.add(name);

            }


            campaigns.add(
                getCampaignName(lead)
            );


        }
    );




    let salespersonSelect =
    document.getElementById("salesperson-stats");


    let campaignSelect =
    document.getElementById("lead-campaigns");



    salespersonSelect.innerHTML =
    `<option value="">Select Salesperson</option>`;


    [...salespeople]
    .sort()
    .forEach(
        name=>{

            salespersonSelect.innerHTML +=
            `<option value="${name}">${name}</option>`;

        }
    );




    campaignSelect.innerHTML =
    `<option value="">Select Campaign</option>`;


    [...campaigns]
    .sort()
    .forEach(
        name=>{

            campaignSelect.innerHTML +=
            `<option value="${name}">${name}</option>`;

        }
    );


}




const applyFiltersBtn =
document.querySelector(".filters button");


if(applyFiltersBtn){


    applyFiltersBtn.addEventListener(
        "click",
        function(){


            let selectedRep =
            document.getElementById("salesperson-stats").value;


            let selectedCampaign =
            document.getElementById("lead-campaigns").value;


            let filtered =
            crmData.filter(
                lead=>{


                    let repMatch =

                    !selectedRep

                    ||

                    String(
                        lead["Attended By"] || ""
                    )
                    .trim()
                    === selectedRep;



                    let campaignMatch =

                    !selectedCampaign

                    ||

                    getCampaignName(lead)
                    === selectedCampaign;



                    return repMatch && campaignMatch;


                }
            );


            renderDashboard(filtered);


        }
    );


}




/* ======================================
   CURRENT DATE DISPLAY
====================================== */


function updateDate(){


    const dateElement =
    document.getElementById("current-date");


    if(!dateElement){

        return;

    }


    const today =
    new Date();


    const options = {

        year: "numeric",
        month: "long",
        day: "numeric"

    };


    dateElement.innerText =
    today.toLocaleDateString(
        "en-US",
        options
    );


}




/* ======================================
   INIT
   (kept at the very end of the file so that
   every function/const above already exists
   before this runs — avoids "used before
   initialization" crashes when the page loads
   with data already in sessionStorage)
====================================== */


updateDate();


const storedData =
sessionStorage.getItem("crmData");


if(storedData){


    crmData =
    JSON.parse(storedData);


    console.log(
        "CRM Data Loaded:",
        crmData
    );


    generateDashboard();


}

else{


    showNotification(
        "CRM Data Required",
        "Upload an Excel or CSV file below to get started."
    );


}