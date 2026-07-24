let crmData = [];



/*
======================================
REPORT METRIC ENGINE

To add a new metric later:
1. Add a new entry here
2. Add the checkbox in reports.html

No switch statements required.
======================================
*/


const metricFunctions = {


    "Total Leads": ()=>{

        return crmData.length;

    },



    "Hot Leads": ()=>{

        return crmData.filter(
            lead=>{

                let hotness =
                Number(
                    lead["Lead Hotness"] || 0
                );


                return hotness > 50;

            }
        ).length;

    },



    "Active Representatives": ()=>{

        return new Set(

            crmData.map(
                lead =>
                String(
                    lead["Attended By"] || ""
                ).trim()
            )

            .filter(
                name =>
                name !== ""
                &&
                name !== "N/A"
            )

        ).size;

    },



    "Total Calls": ()=>{

        return crmData.reduce(

            (total,lead)=>{


                return total +

                Number(
                    lead["Total Incoming Answered Calls"]
                    ||
                    lead["Total incoming answered calls"]
                    ||
                    0
                )

                +

                Number(
                    lead["Total Outgoing Answered Calls"]
                    ||
                    lead["Total outgoing answered calls"]
                    ||
                    0
                );


            },

            0

        );

    },



    "Conversion Rate": ()=>{


        let converted =
        crmData.filter(
            lead=>{


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
        ).length;



        if(!crmData.length){

            return "0%";

        }



        return(
            (
                converted /
                crmData.length
            )
            *
            100
        )
        .toFixed(1)
        +
        "%";

    },



    "Top Campaign": ()=>{


        let campaigns={};



        crmData.forEach(
            lead=>{


                let campaign =
                lead["First Campaign"]
                ||
                "Unknown";


                campaign =
                String(campaign).trim();



                campaigns[campaign] =
                (
                    campaigns[campaign]
                    ||
                    0
                )
                +
                1;


            }
        );



        let result =
        Object.entries(campaigns)
        .sort(
            (a,b)=>b[1]-a[1]
        )[0];


        return result
        ?
        result[0]
        :
        "No Data";


    },



    "Lead Sources": ()=>{


        let sources = new Set();


        crmData.forEach(
            lead=>{


                let source =
                lead["First Source of Enquiry"]
                ||
                lead["First Source"]
                ||
                "";


                if(source){

                    sources.add(source);

                }


            }
        );



        return sources.size;


    }


};







document.addEventListener(
"DOMContentLoaded",
()=>{


    console.log(
        "REPORTS JS LOADED"
    );


    updateDate();



    let stored =
    sessionStorage.getItem(
        "crmData"
    );



    if(stored){


        crmData =
        JSON.parse(stored);



        console.log(
            "CRM DATA LOADED:",
            crmData.length
        );


    }


    else{


        console.log(
            "No CRM data found"
        );


    }





    const button =
    document.getElementById(
        "generate-report"
    );



    if(button){


        button.addEventListener(
            "click",
            generateReport
        );


    }



});








function updateDate(){


    let date =
    new Date();



    const element =
    document.getElementById(
        "current-date"
    );


    if(element){


        element.innerText =
        date.toLocaleDateString(
            "en-US",
            {
                month:"long",
                day:"numeric",
                year:"numeric"
            }
        );

    }


}








function calculateMetric(metricName){


    if(
        metricFunctions[metricName]
    ){


        return metricFunctions[metricName]();


    }



    return "N/A";


}









async function generateReport(){



    let selected =
    document.querySelectorAll(
        ".metric:checked"
    );



    if(selected.length===0){


        showNotification(
            "No Metrics Selected",
            "Please select information to include in the report."
        );


        return;


    }






    let html = "";

    let aiMetrics=[];






    selected.forEach(item=>{


        let metricName =
        item.dataset.name;



        let value =
        calculateMetric(
            metricName
        );



        html +=

        `

        <div class="report-item">

            <strong>
            ${metricName}
            </strong>

            :
            ${value}

        </div>

        `;



        aiMetrics.push({

            name:metricName,

            value:value

        });



    });






    document
    .getElementById(
        "report-preview"
    )
    .innerHTML =
    html;





    await generateAIInsights(
        aiMetrics
    );


}









async function generateAIInsights(reportData){


    try{


        const response =
        await fetch(

            "http://127.0.0.1:5000/generate-insight",

            {

                method:"POST",

                headers:{

                    "Content-Type":
                    "application/json"

                },


                body:

                JSON.stringify({

                    metrics:reportData

                })


            }

        );




        const result =
        await response.json();





        if(result.insight){


            document
            .getElementById(
                "insights"
            )
            .innerHTML =


            `

            <div class="ai-result">

            ${result.insight.replace(/\n/g,"<br>")}

            </div>

            `;


        }


        else{


            throw new Error(
                result.error
            );


        }




    }



    catch(error){



        console.error(
            "AI ERROR:",
            error
        );



        document
        .getElementById(
            "insights"
        )
        .innerHTML =


        `

        <div class="ai-error">

        ❗ AI analysis is currently unavailable.

        </div>

        `;



        showNotification(

            "AI Error",

            "Unable to generate insights right now."

        );



    }


}