/* ======================================
   LEADS ANALYTICS
====================================== */


let crmData = [];




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



// Show today's date, whether or not data has been uploaded yet

updateDate();




// Load CRM Data

const storedData =
sessionStorage.getItem("crmData");


if(storedData){


    crmData =
    JSON.parse(storedData);


    console.log(
        "CRM Data Loaded:",
        crmData
    );


    generateLeadAnalytics();


}

else{


    showNotification(
        "CRM Data Required",
        "Please upload an Excel or CSV file from the Dashboard first."
    );

}





function generateLeadAnalytics(){


    updateKPIs();

    updateFunnel();

    updateHotness();

    updateTopSources();


}




/* ======================================
   SHARED HELPERS
====================================== */


// Converted = Booked or Site Visit Completed
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





function updateKPIs(){



    // Total Leads

    document
    .getElementById("total-leads")
    .innerText =
    crmData.length;




    // Hot Leads

    let hotLeads =
    crmData.filter(
        lead=>{


            let hotness =
            Number(
                lead["Lead Hotness"] || 0
            );



            return (
                hotness > 50
            );


        }
    ).length;



    document
    .getElementById("hot-leads")
    .innerText =
    hotLeads;





    // Qualified Leads


    let qualified =
    crmData.filter(
        lead=>{


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
    ).length;



    document
    .getElementById("qualified-leads")
    .innerText =
    qualified;





    // Conversion Rate


    let converted =
    crmData.filter(
        lead => isConvertedLead(lead)
    ).length;



    let conversionRate =
    (
        converted /
        crmData.length
    ) * 100;



    document
    .getElementById("conversion-rate")
    .innerText =
    conversionRate
    ?
    conversionRate.toFixed(1)+"%"
    :
    "0%";



}




/* ======================================
   LEAD FUNNEL
====================================== */


function updateFunnel(){


    // New Leads = every row in the export

    let newLeads =
    crmData.length;



    // Contacted = has a "First contacted on" value

    let contacted =
    crmData.filter(
        lead=>{

            let val =
            String(
                lead["First contacted on"] || "N/A"
            )
            .trim();

            return(
                val !== "N/A"
                &&
                val !== ""
            );

        }
    ).length;



    // Interested = progressed past a brand-new/rejected stage

    let earlyStages =
    [
        "new lead",
        "unqualified",
        "rnr",
        "lost",
        "channel partner registered new lead"
    ];


    let interested =
    crmData.filter(
        lead=>{

            let stage =
            String(
                lead["Lead Stage"] || ""
            )
            .toLowerCase()
            .trim();

            return !earlyStages.includes(stage);

        }
    ).length;



    // Site Visits = has a Site visit Status recorded

    let siteVisits =
    crmData.filter(
        lead=>{

            let val =
            String(
                lead["Site visit Status"] || "N/A"
            )
            .trim();

            return(
                val !== "N/A"
                &&
                val !== ""
            );

        }
    ).length;



    // Converted = Booked or Site Visit Completed

    let converted =
    crmData.filter(
        lead => isConvertedLead(lead)
    ).length;



    document.getElementById("funnel-new").innerText =
    newLeads.toLocaleString();

    document.getElementById("funnel-contacted").innerText =
    contacted.toLocaleString();

    document.getElementById("funnel-interested").innerText =
    interested.toLocaleString();

    document.getElementById("funnel-sitevisits").innerText =
    siteVisits.toLocaleString();

    document.getElementById("funnel-converted").innerText =
    converted.toLocaleString();


}




/* ======================================
   LEAD HOTNESS
====================================== */


function updateHotness(){


    let total = crmData.length;


    if(!total){

        return;

    }



    let hot = 0;
    let warm = 0;
    let cold = 0;


    crmData.forEach(
        lead=>{

            let hotness =
            Number(
                lead["Lead Hotness"] || 0
            );


            if(hotness > 50){

                hot++;

            }

            else if(hotness >= 10){

                warm++;

            }

            else{

                cold++;

            }

        }
    );



    document.getElementById("hotness-hot").innerText =
    Math.round((hot/total)*100) + "%";

    document.getElementById("hotness-warm").innerText =
    Math.round((warm/total)*100) + "%";

    document.getElementById("hotness-cold").innerText =
    Math.round((cold/total)*100) + "%";


}




/* ======================================
   TOP LEAD SOURCES
====================================== */


function updateTopSources(){


    let sources = {};


    crmData.forEach(
        lead=>{

            let source =
            String(
                lead["First-Campaign"] || "Unknown"
            )
            .trim();

            if(source === "" || source === "N/A"){

                source = "Unknown";

            }


            if(!sources[source]){

                sources[source] = {

                    total: 0,

                    converted: 0

                };

            }


            sources[source].total++;


            if(isConvertedLead(lead)){

                sources[source].converted++;

            }

        }
    );



    let ranked =
    Object.entries(sources)
    .sort(
        (a,b) => b[1].total - a[1].total
    )
    .slice(0,5);



    let tbody =
    document.getElementById("sources-table");


    tbody.innerHTML = "";


    ranked.forEach(
        ([name,data])=>{

            let row =
            document.createElement("tr");


            let conversion =
            data.total
            ?
            Math.round((data.converted/data.total)*100)
            :
            0;


            row.innerHTML = `

            <td>${name}</td>
            <td>${data.total.toLocaleString()}</td>
            <td>${conversion}%</td>

            `;


            tbody.appendChild(row);

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