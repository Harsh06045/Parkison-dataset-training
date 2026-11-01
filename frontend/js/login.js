const glow=document.getElementById("cursorGlow");

document.addEventListener("mousemove",(e)=>{

glow.style.left=e.clientX+"px";

glow.style.top=e.clientY+"px";

});

const toggle=document.getElementById("togglePassword");

const password=document.getElementById("password");

toggle.onclick=()=>{

if(password.type==="password"){

password.type="text";

toggle.innerHTML="visibility_off";

}else{

password.type="password";

toggle.innerHTML="visibility";

}

};
