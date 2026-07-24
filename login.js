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
        window.location.href = "index.html";


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

        togglePassword.textContent = "⌣";


    }

    else{


        passwordInput.type = "password";

        togglePassword.textContent = "👁";


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