"use strict";(self.webpackChunkstrapi_app=self.webpackChunkstrapi_app||[]).push([[7787],{50515:(I,O,_)=>{_.d(O,{S:()=>d});var E=_(92132),D=_(57564),a=_(68065),n=_(42035),o=_(43242),l=_(57842),i=_(49687),r=_(56428),P=_(94929);const d=({providers:s,displayAllProviders:h})=>{const{formatMessage:C}=(0,i.A)();return h?(0,E.jsx)(D.x,{gap:4,children:s.map(t=>(0,E.jsx)(a.E,{col:4,children:(0,E.jsx)(M,{provider:t})},t.uid))}):s.length>2&&!h?(0,E.jsxs)(D.x,{gap:4,children:[s.slice(0,2).map(t=>(0,E.jsx)(a.E,{col:4,children:(0,E.jsx)(M,{provider:t})},t.uid)),(0,E.jsx)(a.E,{col:4,children:(0,E.jsx)(n.m,{label:C({id:"global.see-more"}),children:(0,E.jsx)(L,{as:r.N_,to:"/auth/providers",children:(0,E.jsx)("span",{"aria-hidden":!0,children:"\u2022\u2022\u2022"})})})})]}):(0,E.jsx)(A,{justifyContent:"center",children:s.map(t=>(0,E.jsx)(M,{provider:t},t.uid))})},A=(0,P.Ay)(o.s)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({theme:s})=>s.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({theme:s})=>s.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({theme:s})=>s.spaces[2]};
  }
`,M=({provider:s})=>(0,E.jsx)(n.m,{label:s.displayName,children:(0,E.jsx)(L,{href:`${window.strapi.backendURL}/admin/connect/${s.uid}`,children:s.icon?(0,E.jsx)("img",{src:s.icon,"aria-hidden":!0,alt:"",height:"32px"}):(0,E.jsx)(l.o,{children:s.displayName})})}),L=P.Ay.a`
  width: ${136/16}rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${48/16}rem;
  border: 1px solid ${({theme:s})=>s.colors.neutral150};
  border-radius: ${({theme:s})=>s.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({theme:s})=>s.colors.neutral600};
`},57787:(I,O,_)=>{_.r(O),_.d(O,{LoginEE:()=>T});var E=_(92132),D=_(24122),a=_(44370),n=_(43242),o=_(57842),l=_(18181),i=_(49687),r=_(74930),P=_(94929),d=_(96980),A=_(50515),M=_(15126),L=_(63299),s=_(67014),h=_(59080),C=_(79275),t=_(14718),g=_(21272),x=_(82437),j=_(61535),y=_(5790),f=_(12083),c=_(35223),S=_(5409),$=_(2600),N=_(48940),F=_(41286),Q=_(51187),z=_(56336),G=_(39404),H=_(58692),J=_(54257),V=_(501),X=_(57646),Y=_(23120),Z=_(44414),u=_(25962),p=_(14664),e=_(42588),w=_(90325),b=_(62785),k=_(87443),q=_(41032),__=_(22957),E_=_(93179),s_=_(15747),t_=_(85306),a_=_(77965),n_=_(26509),O_=_(84624),D_=_(71210),P_=_(32058),d_=_(81185),M_=_(82261);const B=(0,P.Ay)(D.c)`
  flex: 1;
`,T=R=>{const{formatMessage:U}=(0,i.A)(),{get:W}=(0,l.ry)(),{isLoading:m,data:v=[]}=(0,r.useQuery)(["ee","providers"],async()=>{const{data:K}=await W("/admin/providers");return K},{enabled:window.strapi.features.isEnabled(window.strapi.features.SSO)});return!window.strapi.features.isEnabled(window.strapi.features.SSO)||!m&&v.length===0?(0,E.jsx)(d.L,{...R}):(0,E.jsx)(d.L,{...R,children:(0,E.jsx)(a.a,{paddingTop:7,children:(0,E.jsxs)(n.s,{direction:"column",alignItems:"stretch",gap:7,children:[(0,E.jsxs)(n.s,{children:[(0,E.jsx)(B,{}),(0,E.jsx)(a.a,{paddingLeft:3,paddingRight:3,children:(0,E.jsx)(o.o,{variant:"sigma",textColor:"neutral600",children:U({id:"Auth.login.sso.divider"})})}),(0,E.jsx)(B,{})]}),(0,E.jsx)(A.S,{providers:v,displayAllProviders:!1})]})})})}}}]);
