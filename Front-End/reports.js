/* ======================================
   CRM REPORT GENERATOR
   Uses generated analytics only.
   Does NOT read CRM files.
====================================== */


let lastReportMetrics = [];
let lastInsightSections = [];
let generatedAIReport = null;
let generatedReportHTML = "";




/* ======================================
   NOTIFICATION SYSTEM
====================================== */


function showNotification(title,message){

    let container =
    document.getElementById(
        "notification-container"
    );


    if(!container){

        container =
        document.createElement("div");

        container.id =
        "notification-container";

        document.body.appendChild(
            container
        );

    }



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


    container.appendChild(
        notification
    );


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
   LOAD SAVED ANALYTICS
====================================== */


function getReportAnalytics(){

    let analytics =
    sessionStorage.getItem(
        "reportAnalytics"
    );


    if(!analytics){

        return null;

    }


    try{

        return JSON.parse(
            analytics
        );

    }

    catch(error){

        console.error(
            "Analytics storage error:",
            error
        );

        return null;

    }

}





/* ======================================
   METRIC LOOKUP
====================================== */


function getMetricValue(metricName){


    const analytics =
    getReportAnalytics();


    if(!analytics){

        return "N/A";

    }



    const metrics = {


        "Total Leads":
        analytics.leads?.total,


        "Hot Leads":
        analytics.leads?.hotLeads,


        "Conversions":
        analytics.leads?.conversions,


        "Conversion Rate":
        analytics.leads?.conversionRate,


        "Active Representatives":
        analytics.sales?.representatives,


        "Total Calls":
        analytics.sales?.totalCalls,


        "Top Campaign":
        analytics.campaigns?.topCampaign,


        "Lead Sources":
        analytics.campaigns?.totalCampaigns


    };


    return metrics[metricName] ?? "N/A";

}






/* ======================================
   PAGE LOAD
====================================== */


document.addEventListener(
"DOMContentLoaded",
()=>{


    updateDate();



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



    const downloadButton =
    document.getElementById(
        "download-pdf-btn"
    );


    if(downloadButton){

        downloadButton.addEventListener(
            "click",
            downloadReportPDF
        );

    }



    const storedData =
    sessionStorage.getItem(
        "crmData"
    );


    if(!storedData){

        showNotification(
            "CRM Data Required",
            "Please upload an Excel or CSV file from the Dashboard first."
        );

    }


    console.log(
        "Reports loaded"
    );


});




function updateDate(){

    const element =
    document.getElementById(
        "current-date"
    );


    if(!element){

        return;

    }


    element.innerText =
    new Date()
    .toLocaleDateString(
        "en-US",
        {
            year:"numeric",
            month:"long",
            day:"numeric"
        }
    );

}





/* ======================================
   REPORT GENERATION
====================================== */


async function generateReport(){


    const selected =
    document.querySelectorAll(
        ".metric:checked"
    );



    if(selected.length===0){

        showNotification(
            "No Metrics Selected",
            "Please select information to include."
        );

        return;

    }



    const analytics =
    getReportAnalytics();



    if(!analytics){

        showNotification(
            "Analytics Missing",
            "Visit Dashboard, Leads, Sales and Campaigns after uploading data."
        );

        return;

    }




    let metrics=[];


    selected.forEach(item=>{


        let name =
        item.dataset.name;



        let value =
        getMetricValue(
            name
        );



        metrics.push({

            name:name,

            value:value

        });


    });



    lastReportMetrics =
    metrics;



    await generateAIInsights(
        metrics
    );


}






/* ======================================
   GEMINI REQUEST
====================================== */


async function generateAIInsights(metrics){


    const container =
    document.getElementById(
        "insights"
    );


    container.innerHTML = `

    <div class="insights-loading">

        <div class="loading-bar-track">

            <div class="loading-bar-fill"></div>

        </div>


        <p class="loading-text">
        Generating AI insights...
        </p>


    </div>

    `;



    try{


        const response =
        await fetch(
         "https://thenexus.pythonanywhere.com/generate-insight",
        {

            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({
                metrics:metrics
            })

        });



        const text = await response.text();

        console.log("SERVER RESPONSE:", text);

        const result = JSON.parse(text);



        if(result.insight){


            generatedAIReport = {
                executive_summary: result.insight,
                important_findings: [],
                recommended_actions: []
            };



            container.innerHTML =
            "AI insights generated successfully.";



            document
            .getElementById(
                "report-preview"
            )
            .innerHTML =
            createReportPage(
                lastReportMetrics,
                generatedAIReport
            );



            const downloadButton =
            document.getElementById(
                "download-pdf-btn"
            );


            if(downloadButton){

                downloadButton.disabled = false;

            }



        }


        else{

            throw new Error(
                result.error
            );

        }



    }


    catch(error){


        console.error(
            error
        );


        container.innerHTML = `

        <div class="ai-error">

        AI service temporarily unavailable. Generated report using built-in analytics.

        </div>

        `;


        showNotification(
            "AI Error",
            "Unable to generate insights."
        );


    }



}






function escapeHtml(text){

return String(text)

.replace(/&/g,"&amp;")

.replace(/</g,"&lt;")

.replace(/>/g,"&gt;");

}






function createReportPage(metrics, aiReport){


    let cards = "";


    metrics.forEach(item=>{


        cards += `

        <div class="report-kpi-card">

            <p>
            ${item.name}
            </p>

            <h2>
            ${item.value}
            </h2>

        </div>

        `;


    });



return `

<div class="report-page">


<div class="report-header">

<h1>
CRM Analytics Report
</h1>


<p class="report-subtitle">
Real Estate Performance Intelligence
</p>


<p class="report-date">
Generated:
${new Date().toLocaleDateString()}
</p>


</div>



<div class="report-kpi-grid">

${cards}

</div>




<div class="report-section">

<h3>
Executive Summary
</h3>


<div class="report-summary">

${escapeHtml(aiReport.executive_summary)}

</div>

</div>





<div class="report-section">

<h3>
Important Findings
</h3>


<ul class="report-list">

${aiReport.important_findings.map(
item =>
`<li>${escapeHtml(item)}</li>`
).join("")}

</ul>


</div>





<div class="report-section">

<h3>
Recommended Actions
</h3>


<ul class="report-list">

${aiReport.recommended_actions.map(
item =>
`<li>${escapeHtml(item)}</li>`
).join("")}

</ul>


</div>





<div class="report-footer">

CRM Analytics Dashboard Generator
<br>
Automated Business Intelligence Report

</div>



</div>

`;

}







/* ======================================
   PDF EXPORT
====================================== */


function downloadReportPDF(){


    const report =
    document.querySelector(
        ".report-page"
    );



    if(!report){


        showNotification(
            "No Report Available",
            "Generate a report before downloading."
        );


        return;

    }



    // Force the report to its full A4 render width before capture so the
    // exported PDF looks identical regardless of the screen size it was
    // generated on (otherwise a narrow window produces a squished, many-page PDF).
    const prevWidth = report.style.width;
    report.style.width = "794px";


    html2canvas(
        report,
        {
            scale:2,
            width:794,
            windowWidth:1200,
            backgroundColor:"#ffffff",
            useCORS:true
        }

    )
    .then(canvas=>{


        const imgData =
        canvas.toDataURL(
            "image/png"
        );



        const { jsPDF } =
        window.jspdf;



        const pdf =
        new jsPDF(
            "p",
            "mm",
            "a4"
        );



        const pageWidth =
        pdf.internal.pageSize.getWidth();


        const pageHeight =
        pdf.internal.pageSize.getHeight();


        const imgHeight =
        canvas.height *
        pageWidth /
        canvas.width;


        // Slice the tall report image across as many A4 pages as needed
        // so long reports don't get cut off at the bottom of page 1.

        let heightLeft = imgHeight;
        let position = 0;


        pdf.addImage(
            imgData, "PNG",
            0, position,
            pageWidth, imgHeight
        );

        heightLeft -= pageHeight;


        while(heightLeft > 0){

            position -= pageHeight;
            pdf.addPage();

            pdf.addImage(
                imgData, "PNG",
                0, position,
                pageWidth, imgHeight
            );

            heightLeft -= pageHeight;

        }


        pdf.save(
            "CRM_Analytics_Report.pdf"
        );


    })
    .catch(err=>{

        console.error(err);

        showNotification(
            "PDF Failed",
            "Could not generate the PDF. Please try again."
        );

    })
    .finally(()=>{

        report.style.width = prevWidth;

    });


}