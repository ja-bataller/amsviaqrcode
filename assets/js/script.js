const loginForm = document.querySelector('#loginForm');
const adduserForm = document.querySelector('#newuserForm');
const downloadBtn = document.querySelector('#downloadBtn');

if(loginForm)
{
    // LOG IN VALIDATION
    loginForm.addEventListener('submit', function(e) {
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
    });
}



// QR CODE GENERATOR

if(adduserForm)
{
    adduserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
            let = baseURl = window.location.origin;
            window.location.href = baseURl + '/qrcodegenerator.html';
    });
}


if(downloadBtn)
{
    downloadBtn.addEventListener('click', function() {
        setTimeout(function(){
            $('#alertModal').modal('toggle'); 
         }, 1000);
    });
}

console.log('EVERYTHING IS RUNNING 100%')