"use strict";(self.webpackChunkstrapi_app=self.webpackChunkstrapi_app||[]).push([[5047],{55047:(q,S,t)=>{t.d(S,{ProtectedListPage:()=>gt});var s=t(92132),c=t(21272),j=t(70230),E=t(53432),A=t(55794),L=t(43121),D=t(44494),h=t(57842),C=t(69564),l=t(32559),M=t(44370),$=t(79318),_=t(67479),tt=t(70768),F=t(34508),d=t(21270),K=t(72182),st=t(96586),ot=t(83314),B=t(43242),z=t(94929);const P=z.Ay.div`
  background: ${({theme:a})=>a.colors.danger500};
  border: none;
  border-radius: 16px;
  position: relative;
  height: ${24/16}rem;
  width: ${40/16}rem;

  & span {
    font-size: ${({visibleLabels:a})=>a?"1rem":0};
  }

  &:before {
    content: '';
    background: ${({theme:a})=>a.colors.neutral0};
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    position: absolute;
    transition: all 0.5s;
    left: ${({theme:a})=>a.spaces[1]};
    top: ${({theme:a})=>a.spaces[1]};
  }

  @media (prefers-reduced-motion: reduce) {
    &:before {
      transition: none;
    }
  }
`,nt=z.Ay.button`
  background: transparent;
  padding: 0;
  border: none;

  &[aria-checked='true'] ${P} {
    background: ${({theme:a})=>a.colors.success500};
  }

  &[aria-checked='true'] ${P}:before {
    transform: translateX(1rem);
  }
`,at=c.forwardRef(({label:a,onChange:g,onLabel:v="On",offLabel:r="Off",selected:f,visibleLabels:n=!1,...m},x)=>(0,s.jsx)(nt,{ref:x,role:"switch","aria-checked":f,"aria-label":a,onClick:g,visibleLabels:n,type:"button",...m,children:(0,s.jsxs)(B.s,{children:[(0,s.jsxs)(P,{children:[(0,s.jsx)("span",{children:v}),(0,s.jsx)("span",{children:r})]}),n&&(0,s.jsx)(M.a,{as:"span","aria-hidden":!0,paddingLeft:2,color:f?"success600":"danger600",children:f?v:r})]})}));var H=t(19106),et=t(17840),dt=t(43459),i=t(18181),b=t(31127),V=t(39423),lt=t(31708),it=t(28312),rt=t(49687),O=t(74930),J=t(82437),Q=t(63126),ht=t(56428),X=t(30713),Et=t(55151),At=t(79077),Lt=t(96980),Dt=t(15126),$t=t(63299),Bt=t(67014),Pt=t(59080),bt=t(79275),Ot=t(14718),Wt=t(61535),It=t(5790),Rt=t(12083),Nt=t(35223),Ut=t(5409),pt=t(2600),Ft=t(48940),Kt=t(41286),zt=t(51187),Ht=t(56336),Vt=t(39404),Jt=t(58692),Qt=t(54257),Xt=t(501),Gt=t(57646),Yt=t(23120),Zt=t(44414),kt=t(25962),wt=t(14664),qt=t(42588),_t=t(90325),ts=t(62785),ss=t(87443),os=t(41032),ns=t(22957),as=t(93179),es=t(15747),ds=t(85306),ls=t(77965),is=t(26509),rs=t(84624),hs=t(71210),cs=t(32058),gs=t(81185),vs=t(82261);const ct=()=>{const[a,g]=c.useState(!1),[v,r]=c.useState([]),f=(0,J.d4)(X.s),{formatMessage:n}=(0,rt.A)(),{formatAPIError:m}=(0,i.wq)(),x=(0,i.hN)();(0,i.L4)();const{push:vt}=(0,Q.W6)(),{pathname:G}=(0,Q.zy)(),{isLoading:mt,allowedActions:{canCreate:W,canUpdate:I,canDelete:Y}}=(0,i.ec)(f.settings?.webhooks??{}),{get:xt,post:jt,put:ft}=(0,i.ry)(),{notifyStatus:Z}=(0,j.W)(),{isLoading:ut,data:u=[],error:R,refetch:k}=(0,O.useQuery)("webhooks",async()=>{const{data:{data:o}}=await xt("/admin/webhooks");return o});c.useEffect(()=>{if(R){x({type:"warning",message:m(R)});return}u&&Z(n({id:"Settings.webhooks.list.loading.success",defaultMessage:"Webhooks have been loaded"}))},[u,R,x,n,Z,m]);const w=(0,O.useMutation)(()=>jt("/admin/webhooks/batch-delete",{ids:v}),{onError(o){x({type:"warning",message:m(o)}),g(!1)},onSuccess(){r([]),g(!1),k()}}),yt=(0,O.useMutation)(({id:o,...e})=>ft(`/admin/webhooks/${o}`,e),{onError(o){x({type:"warning",message:m(o)})},onSuccess(){k()}}),Ct=()=>w.mutate(),Mt=o=>r(o?u.map(e=>e.id):[]),Tt=(o,e)=>r(o?p=>[...p,e]:p=>p.filter(St=>St!==e)),N=o=>()=>vt(`${G}/${o}`),U=mt||ut,T=u?.length??0,y=v.length;return(0,s.jsxs)(E.P,{children:[(0,s.jsx)(i.x7,{name:"Webhooks"}),(0,s.jsxs)(A.g,{"aria-busy":U,children:[(0,s.jsx)(L.Q,{title:n({id:"Settings.webhooks.title",defaultMessage:"Webhooks"}),subtitle:n({id:"Settings.webhooks.list.description",defaultMessage:"Get POST changes notifications"}),primaryAction:W&&!U&&(0,s.jsx)(dt.z,{as:ht.k2,startIcon:(0,s.jsx)(b.A,{}),variant:"default",to:`${G}/create`,size:"S",children:n({id:"Settings.webhooks.list.button.add",defaultMessage:"Create new webhook"})})}),y>0&&Y&&(0,s.jsx)(D.B,{startActions:(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(h.o,{variant:"epsilon",textColor:"neutral600",children:n({id:"Settings.webhooks.to.delete",defaultMessage:"{webhooksToDeleteLength, plural, one {# webhook} other {# webhooks}} selected"},{webhooksToDeleteLength:y})}),(0,s.jsx)(C.$,{onClick:()=>g(!0),startIcon:(0,s.jsx)(V.A,{}),size:"L",variant:"danger-light",children:n({id:"global.delete",defaultMessage:"Delete"})})]})}),(0,s.jsx)(l.s,{children:U?(0,s.jsx)(M.a,{background:"neutral0",padding:6,shadow:"filterShadow",hasRadius:!0,children:(0,s.jsx)(i.Bl,{})}):T>0?(0,s.jsxs)($.X,{colCount:5,rowCount:T+1,footer:(0,s.jsx)(_.S,{onClick:W?N("create"):void 0,icon:(0,s.jsx)(b.A,{}),children:n({id:"Settings.webhooks.list.button.add",defaultMessage:"Create new webhook"})}),children:[(0,s.jsx)(tt.d,{children:(0,s.jsxs)(F.Tr,{children:[(0,s.jsx)(d.Th,{children:(0,s.jsx)(K.J,{"aria-label":n({id:"global.select-all-entries",defaultMessage:"Select all entries"}),indeterminate:y>0&&y<T,value:y===T,onValueChange:Mt})}),(0,s.jsx)(d.Th,{width:"20%",children:(0,s.jsx)(h.o,{variant:"sigma",textColor:"neutral600",children:n({id:"global.name",defaultMessage:"Name"})})}),(0,s.jsx)(d.Th,{width:"60%",children:(0,s.jsx)(h.o,{variant:"sigma",textColor:"neutral600",children:n({id:"Settings.webhooks.form.url",defaultMessage:"URL"})})}),(0,s.jsx)(d.Th,{width:"20%",children:(0,s.jsx)(h.o,{variant:"sigma",textColor:"neutral600",children:n({id:"Settings.webhooks.list.th.status",defaultMessage:"Status"})})}),(0,s.jsx)(d.Th,{children:(0,s.jsx)(st.s,{children:n({id:"Settings.webhooks.list.th.actions",defaultMessage:"Actions"})})})]})}),(0,s.jsx)(ot.N,{children:u.map(o=>(0,s.jsxs)(F.Tr,{onClick:I?N(o.id):void 0,style:{cursor:I?"pointer":"default"},children:[(0,s.jsx)(d.Td,{onClick:e=>e.stopPropagation(),children:(0,s.jsx)(K.J,{"aria-label":`${n({id:"global.select",defaultMessage:"Select"})} ${o.name}`,value:v?.includes(o.id),onValueChange:e=>Tt(e,o.id),name:"select"})}),(0,s.jsx)(d.Td,{children:(0,s.jsx)(h.o,{fontWeight:"semiBold",textColor:"neutral800",children:o.name})}),(0,s.jsx)(d.Td,{children:(0,s.jsx)(h.o,{textColor:"neutral800",children:o.url})}),(0,s.jsx)(d.Td,{children:(0,s.jsx)(B.s,{children:(0,s.jsx)(at,{onLabel:n({id:"global.enabled",defaultMessage:"Enabled"}),offLabel:n({id:"global.disabled",defaultMessage:"Disabled"}),label:`${o.name} ${n({id:"Settings.webhooks.list.th.status",defaultMessage:"Status"})}`,selected:o.isEnabled,onChange:e=>{e.stopPropagation(),yt.mutate({...o,isEnabled:!o.isEnabled})},visibleLabels:!0})})}),(0,s.jsx)(d.Td,{children:(0,s.jsxs)(B.s,{gap:1,children:[I&&(0,s.jsx)(H.K,{label:n({id:"Settings.webhooks.events.update",defaultMessage:"Update"}),icon:(0,s.jsx)(lt.A,{}),noBorder:!0}),Y&&(0,s.jsx)(H.K,{onClick:e=>{e.stopPropagation(),r([o.id]),g(!0)},label:n({id:"Settings.webhooks.events.delete",defaultMessage:"Delete webhook"}),icon:(0,s.jsx)(V.A,{}),noBorder:!0})]})})]},o.id))})]}):(0,s.jsx)(et.p,{icon:(0,s.jsx)(it.A,{width:"160px"}),content:n({id:"Settings.webhooks.list.empty.description",defaultMessage:"No webhooks found"}),action:(0,s.jsx)(C.$,{variant:"secondary",startIcon:(0,s.jsx)(b.A,{}),onClick:()=>W?N("create"):{},children:n({id:"Settings.webhooks.list.button.add",defaultMessage:"Create new webhook"})})})})]}),(0,s.jsx)(i.TM,{isOpen:a,onToggleDialog:()=>g(o=>!o),onConfirm:Ct,isConfirmButtonLoading:w.isLoading})]})},gt=()=>{const a=(0,J.d4)(X.s);return(0,s.jsx)(i.kz,{permissions:a.settings?.webhooks.main,children:(0,s.jsx)(ct,{})})}},67479:(q,S,t)=>{t.d(S,{S:()=>C});var s=t(92132),c=t(94929),j=t(44370),E=t(24122),A=t(43242),L=t(57842);const D=(0,c.Ay)(j.a)`
  height: ${24/16}rem;
  width: ${24/16}rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: ${10/16}rem;
    width: ${10/16}rem;
  }

  svg path {
    fill: ${({theme:l})=>l.colors.primary600};
  }
`,h=(0,c.Ay)(j.a)`
  border-radius: 0 0 ${({theme:l})=>l.borderRadius} ${({theme:l})=>l.borderRadius};
  display: block;
  width: 100%;
  border: none;
`,C=({children:l,icon:M,...$})=>(0,s.jsxs)("div",{children:[(0,s.jsx)(E.c,{}),(0,s.jsx)(h,{as:"button",background:"primary100",padding:5,...$,children:(0,s.jsxs)(A.s,{children:[(0,s.jsx)(D,{"aria-hidden":!0,background:"primary200",children:M}),(0,s.jsx)(j.a,{paddingLeft:3,children:(0,s.jsx)(L.o,{variant:"pi",fontWeight:"bold",textColor:"primary600",children:l})})]})})]})}}]);
