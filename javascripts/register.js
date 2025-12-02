function togglePassword() {
    const pw = document.getElementById("password")
    const button = document.getElementById("showpw")   

    if (pw.type === "password") {
        pw.type = "text";
        button.textContent = "Hide";
    } else {
        pw.type = "password";
        button.textContent = "Show";
    }
}

function toggleConfirmPassword() {
    const pw = document.getElementById("confirmpassword")
    const button = document.getElementById("showcpw")   

    if (pw.type === "password") {
        pw.type = "text";
        button.textContent = "Hide";
    } else {
        pw.type = "password";
        button.textContent = "Show";
    }
}

function checkPassword() {
    const pw = document.getElementById("password")
    const cpw = document.getElementById("confirmpassword")

    if (pw != cpw) {
        console.log("passwords dont match")
    } else {
        alert("form submitted successfully");
    }
}