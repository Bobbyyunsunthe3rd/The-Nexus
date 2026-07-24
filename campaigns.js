/* ======================================
   CAMPAIGN ANALYTICS
====================================== */


let crmData = [];

let campaignChart;
let sourceChart;




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
   LOAD CRM DATA
====================================== */


// Show today's date, whether or not data has been uploaded yet

updateDate();


const storedData =
sessionStorage.getItem("crmData");



if(storedData){


    crmData =
    JSON.parse(storedData);


    console.log(
        "Campaign Data Loaded:",
        crmData
    );


    generateCampaignAnalytics();


}

else{


    showNotification(
        "CRM Data Required",
        "Please upload an Excel or CSV file from the Dashboard first."
    );


}







/* ======================================
   MAIN FUNCTION
====================================== */


function generateCampaignAnalytics(){


    updateKPIs();

    createCampaignChart();

    createSourceChart();

    createCampaignTable();


}









/* ======================================
   HELPERS
====================================== */


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

        campaign="Unknown";

    }


    return campaign;


}






function getSourceName(lead){


    let source =

    lead["First Source of Enquiry"] ||

    lead["First Source"] ||

    lead["Source"] ||

    "Unknown";



    source =
    String(source).trim();



    if(
        source === "" ||
        source === "N/A"
    ){

        source="Unknown";

    }


    return source;

}







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








function isHotLead(lead){


    let hotness =

    Number(
        lead["Lead Hotness"] || 0
    );



    return hotness > 50;


}









/* ======================================
   KPI CARDS
====================================== */


function updateKPIs(){



    let campaigns = {};



    crmData.forEach(
        lead=>{


            let name =
            getCampaignName(lead);



            campaigns[name]=
            (
                campaigns[name] || 0
            ) + 1;


        }
    );




    let campaignNames =
    Object.keys(campaigns);



    document
    .getElementById("total-campaigns")
    .innerText =
    campaignNames.length;




    document
    .getElementById("campaign-leads")
    .innerText =
    crmData.length;





    let best =

    campaignNames.sort(

        (a,b)=>

        campaigns[b]
        -
        campaigns[a]

    )[0];




    document
    .getElementById("best-campaign")
    .innerText =
    best || "-";






    let converted =

    crmData.filter(
        lead =>
        isConvertedLead(lead)
    ).length;




    let rate =

    crmData.length

    ?

    (
        converted /
        crmData.length
    )
    *
    100

    :

    0;



    document
    .getElementById("avg-conversion")
    .innerText =
    rate.toFixed(1)
    +
    "%";


}









/* ======================================
   CAMPAIGN BAR CHART
====================================== */


function createCampaignChart(){



    let campaignCount={};



    crmData.forEach(
        lead=>{


            let name =
            getCampaignName(lead);



            campaignCount[name] =

            (
                campaignCount[name]
                ||
                0
            )
            +
            1;



        }
    );




    let data =

    Object.entries(campaignCount)

    .sort(
        (a,b)=>
        b[1]-a[1]
    )

    .slice(0,10);




    let labels =
    data.map(
        item=>item[0]
    );



    let values =
    data.map(
        item=>item[1]
    );





    let ctx =
    document
    .getElementById("campaignChart");



    campaignChart =
    new Chart(
        ctx,
        {


        type:"bar",


        data:{


            labels:labels,


            datasets:[{


                label:"Leads",


                data:values


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


    });



}









/* ======================================
   SOURCE PIE CHART
====================================== */


function createSourceChart(){



    let sources={};



    crmData.forEach(
        lead=>{


            let source =
            getSourceName(lead);



            sources[source]=

            (
                sources[source]
                ||
                0
            )
            +
            1;


        }
    );




    let data =

    Object.entries(sources)

    .sort(
        (a,b)=>
        b[1]-a[1]
    )

    .slice(0,6);





    let ctx =

    document
    .getElementById("sourceChart");



    sourceChart =

    new Chart(
        ctx,
        {


        type:"doughnut",


        data:{


            labels:

            data.map(
                x=>x[0]
            ),


            datasets:[{


                data:

                data.map(
                    x=>x[1]
                )


            }]


        },


        options:{


            responsive:true


        }


    });



}








/* ======================================
   CAMPAIGN TABLE
====================================== */


function createCampaignTable(){



    let campaigns={};



    crmData.forEach(
        lead=>{


            let name =
            getCampaignName(lead);



            if(!campaigns[name]){


                campaigns[name]={

                    leads:0,

                    hot:0,

                    converted:0

                };


            }



            campaigns[name].leads++;



            if(
                isHotLead(lead)
            ){

                campaigns[name].hot++;

            }



            if(
                isConvertedLead(lead)
            ){

                campaigns[name].converted++;

            }


        }
    );





    let ranked =

    Object.entries(campaigns)

    .sort(
        (a,b)=>
        b[1].leads -
        a[1].leads
    )

    .slice(0,10);






    let tbody =

    document
    .getElementById("campaign-table");



    tbody.innerHTML="";





    ranked.forEach(
        ([name,data])=>{


            let conversion =

            data.leads

            ?

            Math.round(

                (
                    data.converted /
                    data.leads

                )
                *
                100

            )

            :

            0;





            let row =
            document.createElement("tr");



            row.innerHTML = `


            <td>${name}</td>

            <td>${data.leads}</td>

            <td>${data.hot}</td>

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