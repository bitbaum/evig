"use strict";(self.webpackChunkstrapi_app=self.webpackChunkstrapi_app||[]).push([[6633],{6633:(W,D,_)=>{_.r(D),_.d(D,{FORMS:()=>U});var s=_(92132),i=_(55794),a=_(44370),n=_(57842),d=_(43242),h=_(62228),C=_(69564),A=_(24122),l=_(41171),v=_(18181),B=_(49687),M=_(74930),P=_(63126),E=_(56428),r=_(94929),o=_(96980),t=_(50515),j=_(15126),c=_(63299),f=_(67014),y=_(59080),S=_(79275),e=_(14718),$=_(21272),u=_(82437),N=_(61535),F=_(5790),p=_(12083),z=_(35223),Q=_(5409),G=_(2600),H=_(48940),J=_(41286),V=_(51187),X=_(56336),Y=_(39404),Z=_(58692),w=_(54257),k=_(501),b=_(57646),q=_(23120),__=_(44414),s_=_(25962),E_=_(14664),t_=_(42588),a_=_(90325),n_=_(62785),d_=_(87443),o_=_(41032),O_=_(22957),M_=_(93179),P_=_(15747),D_=_(85306),i_=_(77965),l_=_(26509),r_=_(84624),h_=_(71210),C_=_(32058),A_=_(81185),v_=_(82261);const T=()=>{const{push:I}=(0,P.W6)(),{formatMessage:O}=(0,B.A)(),{get:K}=(0,v.ry)(),{isLoading:R,data:L=[]}=(0,M.useQuery)(["ee","providers"],async()=>{const{data:x}=await K("/admin/providers");return x},{enabled:window.strapi.features.isEnabled(window.strapi.features.SSO)}),g=()=>{I("/auth/login")};return!window.strapi.features.isEnabled(window.strapi.features.SSO)||!R&&L.length===0?(0,s.jsx)(P.rd,{to:"/auth/login"}):(0,s.jsx)(o.U,{children:(0,s.jsxs)(i.g,{children:[(0,s.jsxs)(o.d,{children:[(0,s.jsxs)(o.C,{children:[(0,s.jsx)(o.e,{}),(0,s.jsx)(a.a,{paddingTop:6,paddingBottom:1,children:(0,s.jsx)(n.o,{as:"h1",variant:"alpha",children:O({id:"Auth.form.welcome.title"})})}),(0,s.jsx)(a.a,{paddingBottom:7,children:(0,s.jsx)(n.o,{variant:"epsilon",textColor:"neutral600",children:O({id:"Auth.login.sso.subtitle"})})})]}),(0,s.jsxs)(d.s,{direction:"column",alignItems:"stretch",gap:7,children:[R?(0,s.jsx)(d.s,{justifyContent:"center",children:(0,s.jsx)(h.a,{children:O({id:"Auth.login.sso.loading"})})}):(0,s.jsx)(t.S,{providers:L}),(0,s.jsxs)(d.s,{children:[(0,s.jsx)(m,{}),(0,s.jsx)(a.a,{paddingLeft:3,paddingRight:3,children:(0,s.jsx)(n.o,{variant:"sigma",textColor:"neutral600",children:O({id:"or"})})}),(0,s.jsx)(m,{})]}),(0,s.jsx)(C.$,{fullWidth:!0,size:"L",onClick:g,children:O({id:"Auth.form.button.login.strapi"})})]})]}),(0,s.jsx)(d.s,{justifyContent:"center",children:(0,s.jsx)(a.a,{paddingTop:4,children:(0,s.jsx)(l.N,{as:E.k2,to:"/auth/forgot-password",children:(0,s.jsx)(n.o,{variant:"pi",children:O({id:"Auth.link.forgot-password"})})})})})]})})},m=(0,r.Ay)(A.c)`
  flex: 1;
`,U={providers:T}},50515:(W,D,_)=>{_.d(D,{S:()=>v});var s=_(92132),i=_(57564),a=_(68065),n=_(42035),d=_(43242),h=_(57842),C=_(49687),A=_(56428),l=_(94929);const v=({providers:E,displayAllProviders:r})=>{const{formatMessage:o}=(0,C.A)();return r?(0,s.jsx)(i.x,{gap:4,children:E.map(t=>(0,s.jsx)(a.E,{col:4,children:(0,s.jsx)(M,{provider:t})},t.uid))}):E.length>2&&!r?(0,s.jsxs)(i.x,{gap:4,children:[E.slice(0,2).map(t=>(0,s.jsx)(a.E,{col:4,children:(0,s.jsx)(M,{provider:t})},t.uid)),(0,s.jsx)(a.E,{col:4,children:(0,s.jsx)(n.m,{label:o({id:"global.see-more"}),children:(0,s.jsx)(P,{as:A.N_,to:"/auth/providers",children:(0,s.jsx)("span",{"aria-hidden":!0,children:"\u2022\u2022\u2022"})})})})]}):(0,s.jsx)(B,{justifyContent:"center",children:E.map(t=>(0,s.jsx)(M,{provider:t},t.uid))})},B=(0,l.Ay)(d.s)`
  & a:not(:first-child):not(:last-child) {
    margin: 0 ${({theme:E})=>E.spaces[2]};
  }
  & a:first-child {
    margin-right: ${({theme:E})=>E.spaces[2]};
  }
  & a:last-child {
    margin-left: ${({theme:E})=>E.spaces[2]};
  }
`,M=({provider:E})=>(0,s.jsx)(n.m,{label:E.displayName,children:(0,s.jsx)(P,{href:`${window.strapi.backendURL}/admin/connect/${E.uid}`,children:E.icon?(0,s.jsx)("img",{src:E.icon,"aria-hidden":!0,alt:"",height:"32px"}):(0,s.jsx)(h.o,{children:E.displayName})})}),P=l.Ay.a`
  width: ${136/16}rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: ${48/16}rem;
  border: 1px solid ${({theme:E})=>E.colors.neutral150};
  border-radius: ${({theme:E})=>E.borderRadius};
  text-decoration: inherit;
  &:link {
    text-decoration: none;
  }
  color: ${({theme:E})=>E.colors.neutral600};
`}}]);
