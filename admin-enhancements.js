(()=>{
  const addStyle=()=>{if(document.getElementById('nexus-auth-style'))return;const s=document.createElement('style');s.id='nexus-auth-style';s.textContent='@keyframes nexusspin{to{transform:rotate(360deg)}}';document.head.appendChild(s)};
  const spinner=label=>'<span style="display:inline-block;width:13px;height:13px;margin-right:7px;border:2px solid rgba(255,255,255,.45);border-top-color:#fff;border-radius:50%;vertical-align:-2px;animation:nexusspin .7s linear infinite"></span>'+label;
  const attachToggle=(input,label='Show')=>{const wrap=document.createElement('div');wrap.style.position='relative';input.parentNode.insertBefore(wrap,input);wrap.appendChild(input);input.style.paddingRight='76px';const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label','Show password');Object.assign(b.style,{position:'absolute',right:'1px',top:'1px',bottom:'1px',width:'68px',border:'0',borderLeft:'1px solid rgba(75,46,146,.18)',background:'#F5F2FC',color:'#4B2E92',fontWeight:'700',cursor:'pointer'});b.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';b.textContent=show?'Hide':'Show';b.setAttribute('aria-label',show?'Hide password':'Show password')};wrap.appendChild(b)};
  addStyle();

  async function renderReset(){
    app.innerHTML='<div class="login"><h1>Reset admin password</h1><p class="muted">Choose a new password for your NEXUS admin account.</p><div id="resetNotice" class="notice">Verifying your secure link…</div><form id="resetForm" class="formgrid" style="display:none"><div class="field full"><label>New password</label><input id="newPassword" type="password" minlength="8" autocomplete="new-password" required></div><div class="field full"><label>Confirm password</label><input id="confirmPassword" type="password" minlength="8" autocomplete="new-password" required></div><div id="resetStatus" class="field full" style="min-height:20px;font-size:12px;color:#6d6680" aria-live="polite"></div><div class="field full"><button id="resetPasswordBtn" class="btn" type="submit">Update password</button></div></form></div>';
    attachToggle(newPassword);attachToggle(confirmPassword);
    const reveal=()=>{resetNotice.textContent='Link verified. Enter your new password below.';resetForm.style.display='grid'};
    const {data:{session}}=await sb.auth.getSession();
    if(session) reveal();
    const {data:listener}=sb.auth.onAuthStateChange((event,nextSession)=>{if(nextSession&&(event==='PASSWORD_RECOVERY'||event==='SIGNED_IN'||event==='INITIAL_SESSION'))reveal()});
    setTimeout(async()=>{const {data:{session:later}}=await sb.auth.getSession();if(!later&&resetForm.style.display==='none'){resetNotice.innerHTML='This reset link is invalid or expired. <a href="/admin-login">Request a new reset email</a>.'}},1800);
    resetForm.onsubmit=async e=>{e.preventDefault();if(newPassword.value.length<8){resetStatus.textContent='Use at least 8 characters.';return}if(newPassword.value!==confirmPassword.value){resetStatus.textContent='Passwords do not match.';return}resetPasswordBtn.disabled=true;resetPasswordBtn.innerHTML=spinner('Updating…');resetStatus.textContent='Saving your new password…';const {error}=await sb.auth.updateUser({password:newPassword.value});if(error){resetPasswordBtn.disabled=false;resetPasswordBtn.textContent='Update password';resetStatus.textContent=error.message;return}resetStatus.textContent='Password updated. Opening NEXUS Admin…';listener?.subscription?.unsubscribe?.();setTimeout(()=>location.href='/admin',700)};
  }

  function enhanceLogin(){
    const form=document.getElementById('loginForm');if(!form||form.dataset.enhanced)return;form.dataset.enhanced='1';
    const pw=form.querySelector('input[name="password"]'),email=form.querySelector('input[name="email"]'),submit=form.querySelector('button.btn');if(pw)attachToggle(pw);
    const status=document.createElement('div');status.setAttribute('aria-live','polite');status.style.cssText='grid-column:1/-1;min-height:20px;font-size:12px;color:#6d6680';
    const action=form.querySelector('.field.full:last-child');if(action)form.insertBefore(status,action);
    form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;submit.innerHTML=spinner('Signing in…');status.textContent='Checking your credentials…';const {error}=await sb.auth.signInWithPassword({email:(email.value||'').trim(),password:pw.value});if(error){submit.disabled=false;submit.textContent='Sign in';status.textContent='Email or password is incorrect.';return}status.textContent='Verifying NEXUS access…';const who=await currentAdmin();if(!who){await sb.auth.signOut();submit.disabled=false;submit.textContent='Sign in';status.textContent='This account does not have active NEXUS admin access.';return}status.textContent='Access confirmed. Opening dashboard…';location.href='/admin'};
    const forgot=document.createElement('button');forgot.type='button';forgot.textContent='Forgot password?';forgot.style.cssText='border:0;background:transparent;color:#4B2E92;padding:8px 0 0;font-weight:700;text-decoration:underline;text-underline-offset:3px;cursor:pointer';
    let cooldown=0,timer=null;const tick=()=>{cooldown--;if(cooldown>0){forgot.textContent='Try again in '+cooldown+'s';forgot.disabled=true}else{clearInterval(timer);forgot.textContent='Forgot password?';forgot.disabled=false}};
    forgot.onclick=async()=>{const value=(email.value||'').trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)){status.textContent='Enter a valid email address first.';email.focus();return}forgot.disabled=true;forgot.textContent='Sending…';status.textContent='Requesting a secure reset link…';const {data,error}=await sb.functions.invoke('admin-recovery',{body:{email:value}});if(error){status.textContent='Unable to request a reset right now. Please try again shortly.'}else{status.textContent=(data&&data.message)||'If this email belongs to an active NEXUS admin account, a reset email will arrive shortly.'}cooldown=90;tick();timer=setInterval(tick,1000)};
    action?.appendChild(forgot);
  }

  if(location.pathname==='/admin-reset') renderReset();
  else {enhanceLogin();setTimeout(enhanceLogin,250)}
})();