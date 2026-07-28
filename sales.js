/* ======================================
   SALES TEAM ANALYTICS
====================================== */


let crmData = [];

let repChart = null;




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



// Load CRM Data

const storedData =
sessionStorage.getItem("crmData");


// Date should always show, whether or not data has been uploaded yet

updateDate();


if(storedData){


    crmData =
    JSON.parse(storedData);


    generateSalesAnalytics();


}

else{


    showNotification(
        "CRM Data Required",
        "Please upload an Excel or CSV file from the Dashboard first."
    );


}




/* ======================================
   SHARED HELPERS
====================================== */


// Converted = Booked or Site Visit Completed
// (matches the definition used on the Leads page)

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




// "First contacted on in Minutes" is actually a
// duration string like "7524:54:35" (hrs:min:sec),
// not a plain number. Convert to total minutes.

function parseDurationToMinutes(value){


    if(
        !value
        ||
        value === "N/A"
    ){

        return null;

    }


    let parts =
    String(value)
    .trim()
    .split(":");


    if(parts.length !== 3){

        return null;

    }


    let hours =
    Number(parts[0]);

    let minutes =
    Number(parts[1]);

    let seconds =
    Number(parts[2]);


    if(
        isNaN(hours) ||
        isNaN(minutes) ||
        isNaN(seconds)
    ){

        return null;

    }


    return(
        (hours * 60)
        +
        minutes
        +
        (seconds / 60)
    );


}




// Format minutes into a readable string

function formatResponseTime(minutes){


    if(
        minutes === null
        ||
        isNaN(minutes)
    ){

        return "N/A";

    }


    if(minutes < 60){

        return Math.round(minutes) + " min";

    }


    if(minutes < 1440){

        return (minutes/60).toFixed(1) + " hrs";

    }


    return (minutes/1440).toFixed(1) + " days";


}




/* ======================================
   BUILD EVERYTHING
====================================== */


function generateSalesAnalytics(){


    const reps =
    buildRepStats();


    updateSalesKPIs(reps);


    updateRepChart(reps);


    updateRepCards(reps);


    updateRepTable(reps);


    updateDate();


}




/* ======================================
   PER-REP AGGREGATION
====================================== */


function buildRepStats(){


    let reps = {};


    crmData.forEach(
        lead=>{


            let name =
            String(
                lead["Attended By"] || ""
            )
            .trim();


            if(!name || name === "N/A"){

                return;

            }


            if(!reps[name]){

                reps[name] = {

                    leads: 0,

                    incomingAnswered: 0,
                    incomingMissed: 0,
                    outgoingAnswered: 0,
                    outgoingMissed: 0,

                    responseTimes: [],

                    converted: 0

                };

            }


            let rep = reps[name];


            rep.leads++;


            rep.incomingAnswered +=
            Number(
                lead["Total Incoming Answered Calls"] || 0
            );

            rep.incomingMissed +=
            Number(
                lead["Total Incoming Not Answered Calls"] || 0
            );

            rep.outgoingAnswered +=
            Number(
                lead["Total Outgoing Answered Calls"] || 0
            );

            rep.outgoingMissed +=
            Number(
                lead["Total Outgoing Not Answered Calls"] || 0
            );


            let responseMinutes =
            parseDurationToMinutes(
                lead["First contacted on in Minutes"]
            );


            if(responseMinutes !== null){

                rep.responseTimes.push(responseMinutes);

            }


            if(isConvertedLead(lead)){

                rep.converted++;

            }


        }
    );


    return reps;


}




/* ======================================
   KPI CARDS
====================================== */


function updateSalesKPIs(reps){


    let repNames =
    Object.keys(reps);


    document.getElementById("total-reps").innerText =
    repNames.length;



    let totalCalls = 0;

    let allResponseTimes = [];

    let totalLeads = 0;

    let totalConverted = 0;


    repNames.forEach(
        name=>{

            let rep = reps[name];


            totalCalls +=
            rep.incomingAnswered
            +
            rep.incomingMissed
            +
            rep.outgoingAnswered
            +
            rep.outgoingMissed;


            allResponseTimes =
            allResponseTimes.concat(
                rep.responseTimes
            );


            totalLeads += rep.leads;

            totalConverted += rep.converted;

        }
    );


    document.getElementById("total-calls").innerText =
    totalCalls.toLocaleString();



    let avgResponse =
    allResponseTimes.length
    ?
    (
        allResponseTimes.reduce(
            (a,b)=>a+b, 0
        )
        /
        allResponseTimes.length
    )
    :
    null;


    document.getElementById("avg-response-time").innerText =
    formatResponseTime(avgResponse);



    let conversionRate =
    totalLeads
    ?
    (totalConverted/totalLeads)*100
    :
    0;


    document.getElementById("team-conversion-rate").innerText =
    conversionRate.toFixed(1) + "%";

    let reportAnalytics =
    JSON.parse(
        sessionStorage.getItem("reportAnalytics")
    ) || {};


    reportAnalytics.sales = {

        representatives: repNames.length,

        totalCalls: totalCalls,

        conversionRate: conversionRate.toFixed(1) + "%"

    };


    sessionStorage.setItem(
        "reportAnalytics",
        JSON.stringify(reportAnalytics)
    );
}




/* ======================================
   CHART
====================================== */


function updateRepChart(reps){


    const ctx =
    document.getElementById("repChart");


    if(repChart){

        repChart.destroy();

    }


    let names =
    Object.keys(reps)
    .sort(
        (a,b) => reps[b].leads - reps[a].leads
    );


    let counts =
    names.map(
        name => reps[name].leads
    );


    repChart =
    new Chart(
        ctx,
        {

            type:"bar",

            data:{

                labels: names,

                datasets:[{

                    label:"Leads Handled",

                    data: counts,

                    backgroundColor:"#214268"

                }]

            },

            options:{

                indexAxis:"y"

            }

        }
    );


}




/* ======================================
   REP CARDS
====================================== */


function getInitials(name){

    return(
        name
        .split(" ")
        .filter(Boolean)
        .map(word => word[0])
        .join("")
        .toUpperCase()
        .slice(0,2)
    );

}




function updateRepCards(reps){


    let container =
    document.getElementById("rep-cards");


    container.innerHTML = "";


    let medals =
    ["🥇","🥈","🥉"];


    // Rank by conversion rate (min 1 lead handled)

    let ranked =
    Object.entries(reps)
    .map(
        ([name,data])=>{

            let conversion =
            data.leads
            ?
            (data.converted/data.leads)*100
            :
            0;


            let avgResponse =
            data.responseTimes.length
            ?
            (
                data.responseTimes.reduce(
                    (a,b)=>a+b, 0
                )
                /
                data.responseTimes.length
            )
            :
            null;


            let totalCalls =
            data.incomingAnswered
            +
            data.incomingMissed
            +
            data.outgoingAnswered
            +
            data.outgoingMissed;


            return {
                name,
                data,
                conversion,
                avgResponse,
                totalCalls
            };

        }
    )
    .sort(
        (a,b) => b.conversion - a.conversion
    );



    ranked.forEach(
        (rep, index)=>{


            let card =
            document.createElement("div");


            let isTop =
            index === 0;


            card.className =
            "rep-card"
            +
            (isTop ? " rank-1" : "");


            let medal =
            medals[index] || "";


            let barWidth =
            Math.min(
                Math.round(rep.conversion),
                100
            );


            card.innerHTML = `

            <div class="rep-rank">${medal}</div>

            <div class="rep-avatar">${getInitials(rep.name)}</div>

            <div class="rep-name">${rep.name}</div>
            <div class="rep-title">Sales Rep</div>

            <div class="rep-stat-grid">

                <div class="rep-stat">
                    <div class="rep-stat-value">${rep.data.leads}</div>
                    <div class="rep-stat-label">Leads</div>
                </div>

                <div class="rep-stat">
                    <div class="rep-stat-value">${rep.totalCalls}</div>
                    <div class="rep-stat-label">Calls</div>
                </div>

                <div class="rep-stat">
                    <div class="rep-stat-value">${rep.data.converted}</div>
                    <div class="rep-stat-label">Converted</div>
                </div>

                <div class="rep-stat">
                    <div class="rep-stat-value">${formatResponseTime(rep.avgResponse)}</div>
                    <div class="rep-stat-label">Response</div>
                </div>

            </div>

            <div class="rep-score-bar">
                <div class="rep-score-fill" style="width:${barWidth}%"></div>
            </div>

            <div class="rep-score-label">${rep.conversion.toFixed(1)}% Conversion</div>

            `;


            container.appendChild(card);


        }
    );


}




/* ======================================
   BREAKDOWN TABLE
====================================== */


function updateRepTable(reps){


    let tbody =
    document.getElementById(
        "sales-breakdown-table"
    );


    tbody.innerHTML = "";


    let names =
    Object.keys(reps)
    .sort(
        (a,b) => reps[b].leads - reps[a].leads
    );


    names.forEach(
        name=>{


            let rep = reps[name];


            let avgResponse =
            rep.responseTimes.length
            ?
            (
                rep.responseTimes.reduce(
                    (a,b)=>a+b, 0
                )
                /
                rep.responseTimes.length
            )
            :
            null;


            let conversion =
            rep.leads
            ?
            Math.round(
                (rep.converted/rep.leads)*100
            )
            :
            0;


            let row =
            document.createElement("tr");


            row.innerHTML = `

            <td>${name}</td>
            <td>${rep.leads}</td>
            <td>${rep.incomingAnswered}</td>
            <td>${rep.incomingMissed}</td>
            <td>${rep.outgoingAnswered}</td>
            <td>${rep.outgoingMissed}</td>
            <td>${formatResponseTime(avgResponse)}</td>
            <td>${rep.converted}</td>
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