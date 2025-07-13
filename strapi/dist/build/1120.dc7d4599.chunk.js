"use strict";(self.webpackChunkstrapi_app=self.webpackChunkstrapi_app||[]).push([[1120],{17311:(L,g,s)=>{s.d(g,{B:()=>y,D:()=>B,H:()=>K,R:()=>I});var t=s(92132),r=s(43242),E=s(57842),m=s(53432),c=s(55794),O=s(32559),P=s(43121),d=s(18181),l=s(28556),o=s(95065),M=s(49687),v=s(96980),T=s(80909),n=s(94929);const a=(0,n.Ay)(r.s)`
  svg path {
    fill: ${({theme:i})=>i.colors.neutral600};
  }
`,D=({name:i})=>(0,t.jsxs)(r.s,{background:"primary100",borderStyle:"dashed",borderColor:"primary600",borderWidth:"1px",gap:3,hasRadius:!0,padding:3,shadow:"tableShadow",width:(0,d.a8)(300),children:[(0,t.jsx)(a,{alignItems:"center",background:"neutral200",borderRadius:"50%",height:6,justifyContent:"center",width:6,children:(0,t.jsx)(l.A,{width:`${8/16}rem`})}),(0,t.jsx)(E.o,{fontWeight:"bold",children:i})]}),B=()=>(0,t.jsx)(v.D,{renderItem:i=>{if(i.type===T.D.STAGE)return(0,t.jsx)(D,{name:typeof i.item=="string"?i.item:null})}}),I=({children:i})=>(0,t.jsx)(m.P,{children:(0,t.jsx)(c.g,{tabIndex:-1,children:(0,t.jsx)(O.s,{children:i})})}),y=({href:i})=>{const{formatMessage:h}=(0,M.A)();return(0,t.jsx)(d.N_,{startIcon:(0,t.jsx)(o.A,{}),to:i,children:h({id:"global.back",defaultMessage:"Back"})})},K=({title:i,subtitle:h,navigationAction:U,primaryAction:u})=>(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(d.x7,{name:i}),(0,t.jsx)(P.Q,{navigationAction:U,primaryAction:u,title:i,subtitle:h})]})},23302:(L,g,s)=>{s.d(g,{u:()=>c});var t=s(21272),r=s(18181),E=s(60256),m=s(74930);function c(){const{get:O}=(0,r.ry)(),{formatAPIError:P}=(0,r.wq)(),d=(0,r.hN)(),l=(0,m.useQueries)([{queryKey:["content-manager","components"],async queryFn(){const{data:{data:a}}=await O("/content-manager/components");return a},onError(a){a instanceof E.pe&&d({type:"warning",message:P(a)})}},{queryKey:["content-manager","content-types"],async queryFn(){const{data:{data:a}}=await O("/content-manager/content-types");return a},onError(a){a instanceof E.pe&&d({type:"warning",message:P(a)})}}]),[o,M]=l,v=o.isLoading||M.isLoading,T=t.useMemo(()=>(M?.data??[]).filter(a=>a.kind==="collectionType"&&a.isDisplayed),[M?.data]),n=t.useMemo(()=>(M?.data??[]).filter(a=>a.kind!=="collectionType"&&a.isDisplayed),[M?.data]);return{isLoading:v,components:t.useMemo(()=>o?.data??[],[o?.data]),collectionTypes:T,singleTypes:n}}},38851:(L,g,s)=>{s.d(g,{u:()=>m});var t=s(21272),r=s(18181),E=s(74930);function m(c={}){const{get:O}=(0,r.ry)(),{id:P="",...d}=c,l={populate:"stages"},{data:o,isLoading:M,status:v,refetch:T}=(0,E.useQuery)(["review-workflows","workflows",P],async()=>{const{data:D}=await O(`/admin/review-workflows/workflows/${P}`,{params:{...l,...d}});return D}),n=t.useMemo(()=>{let D=[];return o?.data&&(Array.isArray(o.data)?D=o.data:D=[o.data]),D},[o]);return{meta:t.useMemo(()=>{let D;return o&&"meta"in o&&(D=o.meta),D},[o]),workflows:n,isLoading:M,status:v,refetch:T}}},67479:(L,g,s)=>{s.d(g,{S:()=>l});var t=s(92132),r=s(94929),E=s(44370),m=s(24122),c=s(43242),O=s(57842);const P=(0,r.Ay)(E.a)`
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
    fill: ${({theme:o})=>o.colors.primary600};
  }
`,d=(0,r.Ay)(E.a)`
  border-radius: 0 0 ${({theme:o})=>o.borderRadius} ${({theme:o})=>o.borderRadius};
  display: block;
  width: 100%;
  border: none;
`,l=({children:o,icon:M,...v})=>(0,t.jsxs)("div",{children:[(0,t.jsx)(m.c,{}),(0,t.jsx)(d,{as:"button",background:"primary100",padding:5,...v,children:(0,t.jsxs)(c.s,{children:[(0,t.jsx)(P,{"aria-hidden":!0,background:"primary200",children:M}),(0,t.jsx)(E.a,{paddingLeft:3,children:(0,t.jsx)(O.o,{variant:"pi",fontWeight:"bold",textColor:"primary600",children:o})})]})})]})},81120:(L,g,s)=>{s.d(g,{ProtectedReviewWorkflowsPage:()=>k});var t=s(92132),r=s(21272),E=s(43242),m=s(62228),c=s(79318),O=s(67479),P=s(70768),d=s(34508),l=s(21270),o=s(57842),M=s(96586),v=s(83314),T=s(19106),n=s(18181),a=s(31127),D=s(31708),B=s(39423),I=s(60256),y=s(49687),K=s(74930),i=s(82437),h=s(63126),U=s(94929),u=s(23302),S=s(30713),V=s(11152),$=s(17311),j=s(4939),X=s(80909),Y=s(38851),Ps=s(55151),Os=s(79077),gs=s(96980),ms=s(15126),cs=s(63299),vs=s(67014),fs=s(59080),Ts=s(79275),Cs=s(14718),hs=s(61535),Ls=s(5790),As=s(12083),Ws=s(35223),Rs=s(5409),Bs=s(2600),Is=s(48940),ys=s(41286),Ks=s(51187),Us=s(56336),us=s(39404),js=s(58692),xs=s(54257),ws=s(501),ps=s(57646),Ss=s(23120),$s=s(44414),Ns=s(25962),Fs=s(14664),zs=s(42588),Qs=s(90325),Hs=s(62785),Gs=s(87443),Vs=s(41032),Xs=s(22957),Ys=s(93179),Js=s(15747),Zs=s(85306),ks=s(77965),bs=s(26509),qs=s(84624),st=s(71210),tt=s(32058),ot=s(81185),nt=s(82261);const J=(0,U.Ay)(n.N_)`
  align-items: center;
  height: ${(0,n.a8)(32)};
  display: flex;
  justify-content: center;
  padding: ${({theme:e})=>`${e.spaces[2]}}`};
  width: ${(0,n.a8)(32)};

  svg {
    height: ${(0,n.a8)(12)};
    width: ${(0,n.a8)(12)};

    path {
      fill: ${({theme:e})=>e.colors.neutral500};
    }
  }

  &:hover,
  &:focus {
    svg {
      path {
        fill: ${({theme:e})=>e.colors.neutral800};
      }
    }
  }
`,Z=()=>{const{formatMessage:e}=(0,y.A)(),{push:N}=(0,h.W6)(),{trackUsage:F}=(0,n.z1)(),[x,w]=r.useState(null),[b,A]=r.useState(!1),{collectionTypes:q,singleTypes:ss,isLoading:ts}=(0,u.u)(),{meta:f,workflows:z,isLoading:p,refetch:os}=(0,Y.u)(),{del:ns}=(0,n.ry)(),{formatAPIError:as}=(0,n.wq)(),Q=(0,n.hN)(),{getFeature:es,isLoading:H}=(0,V.u)(),_s=(0,i.d4)(S.s),{allowedActions:{canCreate:G,canDelete:is}}=(0,n.ec)(_s.settings?.["review-workflows"]),C=es("review-workflows")?.[X.C],{mutateAsync:rs,isLoading:ls}=(0,K.useMutation)(async({workflowId:_,stages:W})=>{const{data:{data:R}}=await ns(`/admin/review-workflows/workflows/${_}`,{data:W});return R},{onSuccess(){Q({type:"success",message:{id:"notification.success.deleted",defaultMessage:"Deleted"}})}}),Es=_=>[...q,...ss].find(R=>R.uid===_)?.info.displayName,ds=_=>{w(_)},Ms=()=>{w(null)},Ds=async()=>{if(x)try{const _=await rs({workflowId:x});return await os(),w(null),_}catch(_){return _ instanceof I.pe&&Q({type:"warning",message:as(_)}),null}};return r.useEffect(()=>{!p&&!H&&C&&f&&f?.workflowCount>parseInt(C,10)&&A(!0)},[H,p,f,f?.workflowCount,C]),(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)($.H,{primaryAction:G&&(0,t.jsx)(n.z9,{startIcon:(0,t.jsx)(a.A,{}),size:"S",to:"/settings/review-workflows/create",onClick:_=>{C&&f&&f?.workflowCount>=parseInt(C,10)?(_.preventDefault(),A(!0)):F("willCreateWorkflow")},children:e({id:"Settings.review-workflows.list.page.create",defaultMessage:"Create new workflow"})}),subtitle:e({id:"Settings.review-workflows.list.page.subtitle",defaultMessage:"Manage your content review process"}),title:e({id:"Settings.review-workflows.list.page.title",defaultMessage:"Review Workflows"})}),(0,t.jsxs)($.R,{children:[p||ts?(0,t.jsx)(E.s,{justifyContent:"center",children:(0,t.jsx)(m.a,{children:e({id:"Settings.review-workflows.page.list.isLoading",defaultMessage:"Workflows are loading"})})}):(0,t.jsxs)(c.X,{colCount:3,footer:G&&(0,t.jsx)(O.S,{icon:(0,t.jsx)(a.A,{}),onClick:()=>{C&&f&&f?.workflowCount>=parseInt(C,10)?A(!0):(N("/settings/review-workflows/create"),F("willCreateWorkflow"))},children:e({id:"Settings.review-workflows.list.page.create",defaultMessage:"Create new workflow"})}),rowCount:1,children:[(0,t.jsx)(P.d,{children:(0,t.jsxs)(d.Tr,{children:[(0,t.jsx)(l.Th,{children:(0,t.jsx)(o.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.name.title",defaultMessage:"Name"})})}),(0,t.jsx)(l.Th,{children:(0,t.jsx)(o.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.stages.title",defaultMessage:"Stages"})})}),(0,t.jsx)(l.Th,{children:(0,t.jsx)(o.o,{variant:"sigma",children:e({id:"Settings.review-workflows.list.page.list.column.contentTypes.title",defaultMessage:"Content Types"})})}),(0,t.jsx)(l.Th,{children:(0,t.jsx)(M.s,{children:e({id:"Settings.review-workflows.list.page.list.column.actions.title",defaultMessage:"Actions"})})})]})}),(0,t.jsx)(v.N,{children:z?.map(_=>(0,r.createElement)(d.Tr,{...(0,n.qM)({fn(W){W.target.nodeName!=="BUTTON"&&N(`/settings/review-workflows/${_.id}`)}}),key:`workflow-${_.id}`},(0,t.jsx)(l.Td,{width:(0,n.a8)(250),children:(0,t.jsx)(o.o,{textColor:"neutral800",fontWeight:"bold",ellipsis:!0,children:_.name})}),(0,t.jsx)(l.Td,{children:(0,t.jsx)(o.o,{textColor:"neutral800",children:_.stages.length})}),(0,t.jsx)(l.Td,{children:(0,t.jsx)(o.o,{textColor:"neutral800",children:(_?.contentTypes??[]).map(Es).join(", ")})}),(0,t.jsx)(l.Td,{children:(0,t.jsxs)(E.s,{alignItems:"center",justifyContent:"end",children:[(0,t.jsx)(J,{to:`/settings/review-workflows/${_.id}`,"aria-label":e({id:"Settings.review-workflows.list.page.list.column.actions.edit.label",defaultMessage:"Edit {name}"},{name:_.name}),children:(0,t.jsx)(D.A,{})}),z.length>1&&is&&(0,t.jsx)(T.K,{"aria-label":e({id:"Settings.review-workflows.list.page.list.column.actions.delete.label",defaultMessage:"Delete {name}"},{name:"Default workflow"}),icon:(0,t.jsx)(B.A,{}),noBorder:!0,onClick:()=>{ds(String(_.id))}})]})})))})]}),(0,t.jsx)(n.TM,{bodyText:{id:"Settings.review-workflows.list.page.delete.confirm.body",defaultMessage:"If you remove this worfklow, all stage-related information will be removed for this content-type. Are you sure you want to remove it?"},isConfirmButtonLoading:ls,isOpen:!!x,onToggleDialog:Ms,onConfirm:Ds}),(0,t.jsxs)(j.L.Root,{isOpen:b,onClose:()=>A(!1),children:[(0,t.jsx)(j.L.Title,{children:e({id:"Settings.review-workflows.list.page.workflows.limit.title",defaultMessage:"You\u2019ve reached the limit of workflows in your plan"})}),(0,t.jsx)(j.L.Body,{children:e({id:"Settings.review-workflows.list.page.workflows.limit.body",defaultMessage:"Delete a workflow or contact Sales to enable more workflows."})})]})]})]})},k=()=>{const e=(0,i.d4)(S.s);return(0,t.jsx)(n.kz,{permissions:e.settings?.["review-workflows"]?.main,children:(0,t.jsx)(Z,{})})}}}]);
