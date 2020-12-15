const loginForm = document.querySelector('#loginForm');
const adduserForm = document.querySelector('#newuserForm');
const downloadBtn = document.querySelector('#downloadBtn');
const erroralertizi = document.querySelector("#erroralert")

if(loginForm)
{
    // LOG IN VALIDATION
   
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        let username = document.getElementById("logusername").value;
        let password = document.getElementById("logpass").value;

        console.log(username, password)
        if(username == "admin" && password == "admin")
        {   
            iziToast.success({
                title: 'Login Success',
                position: "topCenter",
                timeout:2000,
            });
            setTimeout(function(){ let = baseURl = window.location.origin;
                window.location.href = baseURl + '/admin.html'; }, 2000);
            
        } else {
            iziToast.error({
                title: "Login Failed",
                message: "Unauthorized Access",
                position: "topCenter",
                timeout: 3000,
            });
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
        
            iziToast.success({
                title: 'Added new user successfuly',
                position: "topCenter",
                timeout:2000,
            });
            setTimeout(function(){ let = baseURl = window.location.origin;
                window.location.href = baseURl + '/qrcodegenerator.html'; }, 2000);
    });
}


if(downloadBtn)
{
    downloadBtn.addEventListener('click', function() {
        iziToast.question({
            timeout: false,
            close: false,
            overlay: true,
            displayMode: 'once',
            id: 'question',
            zindex: 999,
            backgroundColor: '#eeeeee',
            drag: false,
            title: 'Do you want to add another user?',
            message: 'Click Yes if you wish to add another user.',
            position: 'center',
            buttons: [
                ['<button><b>YES</b></button>', function (instance, toast) {
         
                    let = baseURl = window.location.origin;
                    window.location.href = baseURl + '/adduserform.html';({ transitionOut: 'fadeOut' }, toast, 'button');
         
                }, true],
                ['<button>NO</button>', function (instance, toast) {
         
                    let = baseURl = window.location.origin;
                    window.location.href = baseURl + '/users.html';({ transitionOut: 'fadeOut' }, toast, 'button');
         
                }],
            ],
            onClosing: function(instance, toast, closedBy){
                console.info('Closing | closedBy: ' + closedBy);
            },
            onClosed: function(instance, toast, closedBy){
                console.info('Closed | closedBy: ' + closedBy);
            }
        });
    });
}



console.log('EVERYTHING IS RUNNING 100%')