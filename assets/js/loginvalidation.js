
let submitForm = document.getElementById('loginForm')


submitForm.addEventListener('submit', function(e) {
    e.preventDefault();

    let username = document.getElementById("logusername").value;
    let password = document.getElementById("logpass").value;
    let error = document.getElementById("#error");

    console.log(username, password)
    if(username == "admin" && password == "admin")
    {
        let = baseURl = window.location.origin;
        window.location.href = baseURl + '/admin.html';
    } else {
        
        document.getElementById('erroralert').innerHTML = '<div class="alert alert-danger" role="alert">Unauthorized Access!</div>' ;
        document.getElementById("logusername").value = "";
        document.getElementById("logpass").value = "";
    }

})