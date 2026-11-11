/* ΔΕΥΑΟ demo – κοινό script */
var A={};try{A=JSON.parse(localStorage.getItem('a11y')||'{}')}catch(e){}
function sv(){try{localStorage.setItem('a11y',JSON.stringify(A))}catch(e){}}
function $(s,r){return (r||document).querySelector(s)}function $$(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function ap(){var h=document.documentElement;['dark','hc','lh','readable','links','noanim'].forEach(function(k){h.classList.toggle(k,!!A[k])});h.style.setProperty('--fs',(A.f||17)+'px');var r=$('#ruler');if(r)r.style.display=A.ruler?'block':'none';$$('#a11yp [data-k]').forEach(function(b){b.setAttribute('aria-pressed',A[b.dataset.k]?'true':'false')})}
function fs(d){A.f=Math.min(24,Math.max(14,(A.f||17)+d*2));sv();ap()}
function resetA(){A={};sv();ap()}
function openA(e){if(e)e.preventDefault();var p=$('#a11yp'),o=!p.classList.contains('open');p.classList.toggle('open',o);$('#a11yb').setAttribute('aria-expanded',o);if(o)$('button',p).focus()}
function speak(){var t=String(window.getSelection());if(!t){alert('Επιλέξτε πρώτα κείμενο στη σελίδα.');return}if(!window.speechSynthesis){alert('Η συσκευή δεν υποστηρίζει ανάγνωση κειμένου.');return}var u=new SpeechSynthesisUtterance(t);u.lang='el-GR';speechSynthesis.cancel();speechSynthesis.speak(u)}
function ck(v){try{localStorage.setItem('ck',v)}catch(e){}$('#ck').style.display='none'}
document.addEventListener('DOMContentLoaded',function(){
 renderGal();
 $$('#a11yp [data-k]').forEach(function(b){b.onclick=function(){A[b.dataset.k]=!A[b.dataset.k];sv();ap()}});
 var m=$('.menu'),nav=$('#n');
 if(m)m.onclick=function(){var o=nav.classList.toggle('open');m.setAttribute('aria-expanded',o)};
 function setSubmenu(item,open){item.classList.toggle('open',open);$('.nav-trigger',item).setAttribute('aria-expanded',open?'true':'false')}
 function closeSubmenus(except){$$('#n .has-submenu.open').forEach(function(item){if(item!==except)setSubmenu(item,false)})}
 $$('#n .has-submenu').forEach(function(item){
  var trigger=$('.nav-trigger',item);
  item.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'){closeSubmenus(item);setSubmenu(item,true)}});
  item.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'&&!item.contains(document.activeElement))setSubmenu(item,false)});
  item.addEventListener('pointerdown',function(e){item.dataset.pointerType=e.pointerType;item.dataset.openOnPointerDown=item.classList.contains('open')?'true':'false'});
  item.addEventListener('focusin',function(){closeSubmenus(item);setSubmenu(item,true)});
  item.addEventListener('focusout',function(e){if(!item.contains(e.relatedTarget))setSubmenu(item,false)});
  trigger.addEventListener('click',function(e){
   var open;
   if(e.detail===0)open=!item.classList.contains('open');
   else if((e.pointerType||item.dataset.pointerType)==='mouse')open=true;
   else open=item.dataset.openOnPointerDown!=='true';
   closeSubmenus(item);setSubmenu(item,open)
  });
 });
 document.addEventListener('click',function(e){if(nav&&!nav.contains(e.target))closeSubmenus()});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'){
  var open=$('#n .has-submenu.open');
  if(open){setSubmenu(open,false);$('.nav-trigger',open).focus()}
  else if(nav&&nav.classList.contains('open')){nav.classList.remove('open');if(m){m.setAttribute('aria-expanded','false');m.focus()}}
  var p=$('#a11yp');if(p&&p.classList.contains('open')){p.classList.remove('open');$('#a11yb').focus()}
 }});
 document.addEventListener('mousemove',function(e){if(A.ruler)$('#ruler').style.top=(e.clientY-23)+'px'});
 try{if(!localStorage.getItem('ck'))$('#ck').style.display='block'}catch(e){$('#ck').style.display='block'}
 ap();
 // αναζήτηση: μετάβαση στη σελίδα αποτελεσμάτων
 $$('form[data-search]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var q=$('input',f).value.trim();location.href=(f.dataset.search||'')+'search.html?q='+encodeURIComponent(q)})});
 // σελίδα αποτελεσμάτων
 var out=$('#results');if(out){var q=new URLSearchParams(location.search).get('q')||'';$('#sq').value=q;var n=function(t){return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};var v=n(q);var l=window.SITE_INDEX.filter(function(x){return !v||n(x.t+' '+x.d).indexOf(v)>-1});out.innerHTML=l.length?l.map(function(x){return '<a class="doc" href="'+x.u+'"><div><b>'+x.t+'</b><br><small>'+x.d+'</small></div><span>→</span></a>'}).join(''):'<p>Δεν βρέθηκαν αποτελέσματα για «'+q.replace(/</g,'')+'». Δοκιμάστε άλλη λέξη ή καλέστε στο 25520 81880.</p>';var c=$('#rc');if(c)c.textContent=l.length+' αποτελέσματα'}
 // διακοπές νερού: φίλτρα
 var it=$('#items');if(it&&window.OUTAGES){var area='',st='';var draw=function(){var l=window.OUTAGES.filter(function(d){return(!area||d.a==area)&&(!st||d.s==st)});it.innerHTML=l.length?l.map(function(d){return '<div class="it '+d.s+'"><div><b>'+d.a+'</b>'+d.t+'<br><small>'+d.w+'</small></div><span class="st '+d.s+'">'+(d.s=='now'?'Σε εξέλιξη':d.s=='plan'?'Προγραμματισμένη':'Ολοκληρώθηκε')+'</span></div>'}).join(''):'<div class="it">Καμία διακοπή για αυτά τα κριτήρια.</div>'};$('#area').onchange=function(){area=this.value;draw()};$$('.chip[data-s]').forEach(function(c){c.onclick=function(){$$('.chip[data-s]').forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});c.classList.add('on');c.setAttribute('aria-pressed','true');st=c.dataset.s;draw()}});draw()}
 // φίλτρο λίστας (νέα/διαγωνισμοί)
 $$('[data-filter]').forEach(function(g){$$('.chip',g).forEach(function(c){c.onclick=function(){$$('.chip',g).forEach(function(x){x.classList.remove('on');x.setAttribute('aria-pressed','false')});c.classList.add('on');c.setAttribute('aria-pressed','true');var k=c.dataset.k;$$('[data-cat]').forEach(function(e){e.style.display=(!k||e.dataset.cat==k)?'':'none'})}})});
 // φόρμες demo
 $$('form[data-demo]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();var o=$('.ok',f);if(o){o.style.display='block';o.focus()}})});
});
/* Φωτογραφίες: εμφάνιση από το assets/photos.js και μεγέθυνση (lightbox) */
function mk(tag,at,tx){var e=document.createElement(tag);for(var k in at)e.setAttribute(k,at[k]);if(tx)e.textContent=tx;return e}
function gitem(c,it,i){var cap=it.t||(c.label+' ('+(i+1)+')');var a=mk('a',{'class':'g',href:'photos/'+c.folder+'/'+it.n+'.jpg','data-cat':c.k,'data-cap':cap,'aria-label':'Μεγέθυνση: '+cap});a.appendChild(mk('img',{src:'photos/'+c.folder+'/thumbs/'+it.n+'.jpg',alt:it.a||cap,loading:'lazy'}));return a}
function renderGal(){var D=window.PHOTOS||[];var g=$('#gallery');
 if(g){var tabs=$('#galtabs');var all=mk('button',{'class':'chip on','data-k':'','aria-pressed':'true',type:'button'},'Όλες ('+D.reduce(function(s,c){return s+c.items.length},0)+')');tabs.appendChild(all);D.forEach(function(c){tabs.appendChild(mk('button',{'class':'chip','data-k':c.k,'aria-pressed':'false',type:'button'},c.label+' ('+c.items.length+')'))});D.forEach(function(c){c.items.forEach(function(it,i){g.appendChild(gitem(c,it,i))})})}
 var h=$('#homegal');if(h){var f=[],seen={};function add(c,it,i){var k=c.folder+'/'+it.n;if(!seen[k]){seen[k]=1;f.push([c,it,i])}}
  D.forEach(function(c){c.items.forEach(function(it,i){if(it.p)add(c,it,i)})});
  D.forEach(function(c){c.items.slice(0,3).forEach(function(it,i){add(c,it,i)})});
  h.innerHTML='';f.slice(0,15).forEach(function(x){h.appendChild(gitem(x[0],x[1],x[2]))});initCarousel(h)}}
/* Carousel φωτογραφιών αρχικής: βελάκια, πληκτρολόγιο, swipe */
function initCarousel(tr){var box=tr.closest('.carousel');if(!box)return;var pv=$('.car-btn.prev',box),nx=$('.car-btn.next',box);
 var rm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 function step(d){var it=tr.firstElementChild;var w=it?it.getBoundingClientRect().width+14:tr.clientWidth;var per=Math.max(1,Math.round(tr.clientWidth/w));tr.scrollBy({left:d*w*per,behavior:rm?'auto':'smooth'})}
 function upd(){pv.disabled=tr.scrollLeft<=2;nx.disabled=tr.scrollLeft+tr.clientWidth>=tr.scrollWidth-2}
 pv.onclick=function(){step(-1)};nx.onclick=function(){step(1)};
 tr.addEventListener('scroll',upd,{passive:true});window.addEventListener('resize',upd);
 tr.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}if(e.key==='ArrowRight'){e.preventDefault();step(1)}});
 upd();setTimeout(upd,300)}
document.addEventListener('DOMContentLoaded',function(){
 var lb=mk('div',{id:'lb',role:'dialog','aria-modal':'true','aria-label':'Μεγέθυνση φωτογραφίας'});
 lb.innerHTML='<img alt=""><p></p><div class="bar"><button type="button" id="lbp" aria-label="Προηγούμενη φωτογραφία">←</button><button type="button" id="lbc">Κλείσιμο</button><button type="button" id="lbn" aria-label="Επόμενη φωτογραφία">→</button></div>';
 document.body.appendChild(lb);var cur=0,last=null,list=[];
 function vis(){return $$('a.g[data-cap]').filter(function(a){return a.style.display!=='none'})}
 function show(i){list=vis();if(!list.length)return;cur=(i+list.length)%list.length;var a=list[cur];$('img',lb).src=a.getAttribute('href');$('img',lb).alt=$('img',a).alt;$('p',lb).textContent=a.dataset.cap+' ('+(cur+1)+'/'+list.length+')'}
 function close(){lb.classList.remove('open');if(last)last.focus()}
 document.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('a.g[data-cap]');if(!a)return;e.preventDefault();last=a;list=vis();show(list.indexOf(a));lb.classList.add('open');$('#lbc').focus()});
 $('#lbc').onclick=close;$('#lbp').onclick=function(){show(cur-1)};$('#lbn').onclick=function(){show(cur+1)};
 lb.addEventListener('click',function(e){if(e.target===lb)close()});
 document.addEventListener('keydown',function(e){if(!lb.classList.contains('open'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(cur-1);if(e.key==='ArrowRight')show(cur+1)});
});

document.addEventListener('DOMContentLoaded',function(){var d=document.getElementById('popup');if(!d||!d.showModal)return;var k='deyaoPopup',seen=false;try{seen=sessionStorage.getItem(k)}catch(e){}if(seen)return;
 function done(){try{sessionStorage.setItem(k,'1')}catch(e){}d.close()}
 setTimeout(function(){try{d.showModal()}catch(e){}},1200);
 document.getElementById('pclose').onclick=done;d.addEventListener('click',function(e){if(e.target===d)done()});d.addEventListener('cancel',function(){try{sessionStorage.setItem(k,'1')}catch(e){}})});

/* Προεπισκόπηση PDF: φορτώνει το PDF μόνο όταν ανοίξει το πλαίσιο */
document.addEventListener('toggle',function(e){var d=e.target;if(!d.classList||!d.classList.contains('pdfprev')||!d.open)return;var f=$('iframe[data-src]',d);if(f){f.src=f.getAttribute('data-src');f.removeAttribute('data-src')}},true);

/* Πλαϊνό μενού: δείχνει επιλεγμένη την ενότητα της σελίδας (από #, κλικ ή scroll) */
document.addEventListener('DOMContentLoaded',function(){
 var side=$('.side');if(!side)return;
 var page=(location.pathname.split('/').pop()||'index.html');
 var items=$$('a[href*="#"]',side).map(function(a){var h=a.getAttribute('href').split('#');return {a:a,page:h[0]||page,el:document.getElementById(h[1])}}).filter(function(x){return x.page===page&&x.el});
 if(!items.length)return;
 var base=$('a[aria-current="page"]',side),cur,lock=0;
 function mark(a){if(a===cur)return;cur=a;$$('a[aria-current]',side).forEach(function(x){x.removeAttribute('aria-current')});var t=a||base;if(t)t.setAttribute('aria-current',a?'location':'page')}
 function spy(){if(Date.now()<lock)return;var off=140,pick=null,atEnd=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4;
  items.forEach(function(x){var top=x.el.getBoundingClientRect().top;if(top<=off||(atEnd&&top<window.innerHeight))pick=x.a});mark(pick)}
 items.forEach(function(x){x.a.addEventListener('click',function(){mark(x.a);lock=Date.now()+900})});
 window.addEventListener('scroll',spy,{passive:true});
 window.addEventListener('hashchange',function(){var h=location.hash.slice(1);items.forEach(function(x){if(x.el.id===h)mark(x.a)})});
 var h=location.hash.slice(1),hit=null;items.forEach(function(x){if(x.el.id===h)hit=x.a});if(hit)mark(hit);else spy();
});

/* Εφέ εμφάνισης κατά το scroll (σέβεται «απενεργοποίηση κινήσεων» και prefers-reduced-motion) */
document.addEventListener('DOMContentLoaded',function(){
 var h=document.documentElement;
 if(!('IntersectionObserver' in window)||h.classList.contains('noanim')||(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
 var sel='main section h2,main .lead,.ecard,.quick .card,.contact>.card,.cards3>.card,.cards2>.card,.acc3>.card,.ptile,.pcard,.pfeat-home,main .doc,.nlist>li,.car-track,.eco,main .alert,.espa-box,.map,.prose>h2,.tw';
 var els=$$(sel).filter(function(e){return e.getBoundingClientRect().top>window.innerHeight*0.92});
 if(!els.length)return;
 els.forEach(function(e){var p=e.parentElement,i=p?Array.prototype.indexOf.call(p.children,e):0;e.style.transitionDelay=(i%6)*70+'ms';e.classList.add('rv')});
 function done(e){e.classList.remove('rv','in');e.style.transitionDelay=''}
 function show(e){if(e.classList.contains('in')||!e.classList.contains('rv'))return;e.classList.add('in');setTimeout(function(){done(e)},1100)}
 var io=new IntersectionObserver(function(list){list.forEach(function(en){if(en.isIntersecting){io.unobserve(en.target);show(en.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:0.08});
 els.forEach(function(e){io.observe(e)});
 // δεύτερος έλεγχος σε scroll/resize, ώστε τίποτα να μη μείνει κρυφό
 function check(){var lim=window.innerHeight*0.95;$$('.rv:not(.in)').forEach(function(e){if(e.getBoundingClientRect().top<lim)show(e)})}
 var raf=0;function sched(){if(!raf)raf=requestAnimationFrame(function(){raf=0;check()})}
 window.addEventListener('scroll',function(){sched();clearTimeout(window.__rvT);window.__rvT=setTimeout(check,150)},{passive:true});
 window.addEventListener('resize',sched);
 new MutationObserver(function(){if(h.classList.contains('noanim')){io.disconnect();$$('.rv').forEach(done)}}).observe(h,{attributes:true,attributeFilter:['class']});
});
