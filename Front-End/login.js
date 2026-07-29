// =========================
// LOGIN SYSTEM
// =========================


const loginForm = document.getElementById("login-form");

const errorMessage = document.getElementById("login-error");

let errorTimeout = null;



loginForm.addEventListener("submit", function(event) {


    // Stop page refresh
    event.preventDefault();



    const username =
    document.getElementById("username").value;



    const password =
    document.getElementById("password").value;



    if(
        username === "admin" &&
        password === "1234"
    ){

        // Successful login
        window.location.href = "dashboard.html";


    }

    else{


        // Failed login
        errorMessage.style.display = "block";

        errorMessage.textContent =
        "Invalid username or password.";


        // Clear any existing timer so repeated
        // failed attempts don't stack up

        if(errorTimeout){

            clearTimeout(errorTimeout);

        }


        errorTimeout = setTimeout(
            function(){

                errorMessage.style.display = "none";

            },
            3500
        );


    }



});




// =========================
// SHOW / HIDE PASSWORD
// =========================


const passwordInput =
document.getElementById("password");


const togglePassword =
document.getElementById("toggle-password");



togglePassword.addEventListener("click", function(){


    if(passwordInput.type === "password"){


        passwordInput.type = "text";

        togglePassword.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 0 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';

        togglePassword.setAttribute("aria-label", "Hide password");


    }

    else{


        passwordInput.type = "password";

        togglePassword.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';

        togglePassword.setAttribute("aria-label", "Show password");


    }


});




// =========================
// REMEMBER USERNAME
// =========================


const rememberMe =
document.getElementById("remember-me");



const usernameInput =
document.getElementById("username");



// Load saved username
if(localStorage.getItem("savedUsername")){

    usernameInput.value =
    localStorage.getItem("savedUsername");

    rememberMe.checked = true;

}



// Save username
rememberMe.addEventListener("change", function(){


    if(this.checked){


        localStorage.setItem(
            "savedUsername",
            usernameInput.value
        );


    }

    else{


        localStorage.removeItem(
            "savedUsername"
        );


    }


});