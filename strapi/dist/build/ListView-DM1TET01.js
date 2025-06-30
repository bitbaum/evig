import{j as e,k as y,a8 as g,e9 as O,a as A,e as f,T as k,h as pe,r as F,ai as L,I as U,f as ge,fz as me,bA as Y,aK as P,a_ as J,fA as fe,g as K,bc as he,cz as xe,aY as ye,b as X,af as be,s as je,D as B,cE as Ce,ak as we,z as $e,ew as Te,a$ as ve,aq as _,fB as ke,B as Q}from"./strapi-DScFo-y4.js";import{u as D,g as x,C as G,a as Z,A as De,S as Me}from"./index-BoK9uwLT.js";import{d as Re,e as Fe,D as Ae,f as Ee,a as Ie,S as Se,v as Le,P as Oe,c as Ne,C as Ue}from"./sortable.esm-DpU53lEd.js";import"./groupBy-CoY2hrRp.js";import"./_baseEach-CzgU8hb1.js";import"./sortBy-CL_VPkMT.js";import"./_baseMap-_vbrqTrR.js";import"./index-DnCKR_mN.js";import"./index-BRVyLNfZ.js";import"./_arrayIncludesWith-BNzMLSv9.js";const Be=t=>{let{transform:n}=t;return{...n,x:0}},ze=y(g)`
  position: absolute;
  left: -3.4rem;
  top: 0px;

  &:before {
    content: '';
    width: 0.4rem;
    height: 1.2rem;
    background: ${({theme:t,color:n})=>t.colors[n]};
    display: block;
  }
`,Pe=y.svg`
  position: relative;
  flex-shrink: 0;
  transform: translate(-0.5px, -1px);

  * {
    fill: ${({theme:t,color:n})=>t.colors[n]};
  }
`,Ze=t=>e.jsx(ze,{children:e.jsx(Pe,{width:"20",height:"23",viewBox:"0 0 20 23",fill:"none",xmlns:"http://www.w3.org/2000/svg",...t,children:e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M7.02477 14.7513C8.65865 17.0594 11.6046 18.6059 17.5596 18.8856C18.6836 18.9384 19.5976 19.8435 19.5976 20.9688V20.9688C19.5976 22.0941 18.6841 23.0125 17.5599 22.9643C10.9409 22.6805 6.454 20.9387 3.75496 17.1258C0.937988 13.1464 0.486328 7.39309 0.486328 0.593262H4.50974C4.50974 7.54693 5.06394 11.9813 7.02477 14.7513Z"})})}),Ve=t=>{let n;switch(t){case"date":case"datetime":case"time":case"timestamp":n="date";break;case"integer":case"biginteger":case"decimal":case"float":n="number";break;case"string":case"text":n="text";break;case"":n="relation";break;default:n=t}return n},ee=y(g)`
  &.component-row,
  &.dynamiczone-row {
    position: relative;

    > ul:first-of-type {
      padding: 0 0 0 104px;
      position: relative;

      &::before {
        content: '';
        width: 0.4rem;
        height: ${({$isFromDynamicZone:t})=>t?"calc(100% - 65px)":"calc(100%)"};
        position: absolute;
        left: 7rem;
        border-radius: 4px;

        ${({$isFromDynamicZone:t,$isChildOfDynamicZone:n,theme:o})=>n?`background-color: ${o.colors.primary200};`:t?`background-color: ${o.colors.primary200};`:`background: ${o.colors.neutral150};`}
      }
    }
  }

  &.dynamiczone-row > ul:first-of-type {
    padding: 0;
  }
`,te=({component:t,isFromDynamicZone:n=!1,firstLoopComponentUid:o})=>{const{components:s}=D(),l=O(s,t);return e.jsx(ee,{$isChildOfDynamicZone:n,className:"component-row",children:e.jsx(re,{type:l,firstLoopComponentUid:o||t,isFromDynamicZone:n,isSub:!0,secondLoopComponentUid:o?t:null})})},We=({type:t,customField:n=null,repeatable:o=!1,multiple:s=!1})=>{const{formatMessage:l}=A();let a=t;return["integer","biginteger","float","decimal"].includes(t)?a="number":["string"].includes(t)&&(a="text"),n?l({id:x("attribute.customField"),defaultMessage:"Custom field"}):e.jsxs(e.Fragment,{children:[o&&l({id:x("component.repeatable"),defaultMessage:"Repeatable"}),s&&l({id:x("media.multiple"),defaultMessage:"Multiple"})," ",l({id:x(`attribute.${a}`),defaultMessage:t})]})},He=({isActive:t=!1,icon:n="dashboard"})=>{const o=G[n]||G.dashboard;return e.jsx(f,{alignItems:"center",background:t?"primary200":"neutral200",justifyContent:"center",height:8,width:8,borderRadius:"50%",children:e.jsx(o,{height:"2rem",width:"2rem"})})},ne=y(g)`
  position: absolute;
  display: none;
  top: 5px;
  right: 0.8rem;

  svg {
    width: 1rem;
    height: 1rem;

    path {
      fill: ${({theme:t})=>t.colors.primary600};
    }
  }
`,qe=y(f)`
  width: 14rem;
  height: 8rem;
  position: relative;
  border: 1px solid ${({theme:t})=>t.colors.neutral200};
  background: ${({theme:t})=>t.colors.neutral100};
  border-radius: ${({theme:t})=>t.borderRadius};
  max-width: 100%;

  &.active,
  &:focus,
  &:hover {
    border: 1px solid ${({theme:t})=>t.colors.primary200};
    background: ${({theme:t})=>t.colors.primary100};
    color: ${({theme:t})=>t.colors.primary600};

    ${ne} {
      display: block;
    }

    /* > ComponentIcon */
    > div:first-child {
      background: ${({theme:t})=>t.colors.primary200};
      color: ${({theme:t})=>t.colors.primary600};

      svg {
        path {
          fill: ${({theme:t})=>t.colors.primary600};
        }
      }
    }
  }
`,_e=({component:t,dzName:n,index:o,isActive:s=!1,isInDevelopmentMode:l=!1,onClick:a,forTarget:i,targetUid:c,disabled:m})=>{const{components:b,removeComponentFromDynamicZone:T}=D(),r=O(b,t),{icon:d,displayName:u}=r?.info||{},j=w=>{w.stopPropagation(),T({forTarget:i,targetUid:c,dzName:n,componentToRemoveIndex:o})};return e.jsxs(qe,{alignItems:"center",direction:"column",className:s?"active":"",borderRadius:"borderRadius",justifyContent:"center",paddingLeft:4,paddingRight:4,shrink:0,onClick:a,role:"tab",tabIndex:s?0:-1,cursor:"pointer","aria-selected":s,"aria-controls":`dz-${n}-panel-${o}`,id:`dz-${n}-tab-${o}`,children:[e.jsx(He,{icon:d,isActive:s}),e.jsx(g,{marginTop:1,maxWidth:"100%",children:e.jsx(k,{variant:"pi",fontWeight:"bold",ellipsis:!0,children:u})}),l&&!m&&e.jsx(ne,{cursor:"pointer",tag:"button",onClick:j,children:e.jsx(pe,{})})]})},Ge=y(L)`
  width: 3.2rem;
  height: 3.2rem;
  padding: 0.9rem;
  border-radius: 6.4rem;
  background: ${({theme:t,disabled:n})=>n?t.colors.neutral100:t.colors.primary100};
  path {
    fill: ${({theme:t,disabled:n})=>n?t.colors.neutral600:t.colors.primary600};
  }
`,Ye=y(f)`
  flex-shrink: 0;
  width: 14rem;
  height: 8rem;
  justify-content: center;
  align-items: center;
`,Je=({components:t=[],addComponent:n,name:o,forTarget:s,targetUid:l,disabled:a=!1})=>{const{isInDevelopmentMode:i}=D(),[c,m]=F.useState(0),{formatMessage:b}=A(),T=d=>{c!==d&&m(d)},r=()=>{n(o)};return e.jsx(ee,{className:"dynamiczone-row",$isFromDynamicZone:!0,children:e.jsxs(g,{children:[e.jsx(g,{padding:2,paddingLeft:"104px",children:e.jsxs(f,{role:"tablist",gap:2,wrap:"wrap",children:[i&&e.jsx("button",{type:"button",onClick:r,disabled:a,style:{cursor:a?"not-allowed":"pointer"},children:e.jsxs(Ye,{direction:"column",alignItems:"stretch",gap:1,children:[e.jsx(Ge,{disabled:a}),e.jsx(k,{variant:"pi",fontWeight:"bold",textColor:a?"neutral600":"primary600",children:b({id:x("button.component.add"),defaultMessage:"Add a component"})})]})}),t.map((d,u)=>e.jsx(_e,{dzName:o||"",index:u,component:d,isActive:c===u,isInDevelopmentMode:i,onClick:()=>T(u),forTarget:s,targetUid:l,disabled:a},d))]})}),e.jsx(g,{children:t.map((d,u)=>e.jsx(g,{id:`dz-${o}-panel-${u}`,role:"tabpanel","aria-labelledby":`dz-${o}-tab-${u}`,style:{display:c===u?"block":"none"},children:e.jsx(te,{isFromDynamicZone:!0,component:d},d)},d))})]})})},Ke=y(f)`
  justify-content: space-between;

  border-top: ${({theme:t,$isOverlay:n})=>n?"none":`1px solid ${t.colors.neutral150}`};

  padding-top: ${({theme:t})=>t.spaces[4]};
  padding-bottom: ${({theme:t})=>t.spaces[4]};

  opacity: ${({$isDragging:t})=>t?0:1};
  align-items: center;
`,Xe=y(g)`
  list-style: none;
  list-style-type: none;
`,oe=F.forwardRef((t,n)=>{const{style:o,...s}=t;return e.jsx(Xe,{tag:"li",ref:n,...t.attributes,style:o,background:"neutral0",shadow:t.isOverlay?"filterShadow":"none","aria-label":t.item.name,children:e.jsx(Qe,{...s})})}),Qe=F.memo(t=>{const{item:n,firstLoopComponentUid:o,isFromDynamicZone:s,addComponentToDZ:l,secondLoopComponentUid:a,type:i,isDragging:c,isOverlay:m,handleRef:b,listeners:T}=t,r=m||c,[d,u]=F.useState(!0),j=i.status==="REMOVED",{contentTypes:w,removeAttribute:E,isInDevelopmentMode:M}=D(),{onOpenModalEditField:I,onOpenModalEditCustomField:R}=Z(),{formatMessage:h}=A(),p=n.status==="REMOVED",C=n.type==="relation"&&n.relation.includes("morph"),v=["integer","biginteger","float","decimal"].includes(n.type)?"number":n.type,S=n.type==="relation"?O(w,n.target):null,V=O(S,"plugin"),ae="target"in n&&n.target?"relation":v,W=()=>{if(!C&&n.configurable!==!1){const $=a||o||i.uid,q=Ve(n.type),ue=n.type==="component"?"2":null;n.customField?R({forTarget:i.modelType,targetUid:$,attributeName:n.name,attributeType:q,customFieldUid:n.customField}):I({forTarget:i.modelType,targetUid:$,attributeName:n.name,attributeType:q,step:ue})}};let N;a&&o?N=2:o?N=1:N=0;const H=!j&&!p,le=!j&&!p,de=j||p?"not-allowed":"move",ce=M&&n.configurable!==!1&&!C&&H;return e.jsxs(e.Fragment,{children:[e.jsxs(Ke,{$isOverlay:m,$isDragging:c,onClick:ce?W:void 0,paddingLeft:4,paddingRight:4,children:[e.jsxs(f,{alignItems:"center",overflow:"hidden",gap:2,children:[N!==0&&!m&&e.jsx(Ze,{color:s?"primary200":"neutral150"}),M&&e.jsx(U,{cursor:de,role:"Handle",ref:b,...T,variant:"ghost",withTooltip:!1,label:`${h({id:"app.utils.drag",defaultMessage:"Drag"})} ${n.name}`,disabled:j||p,children:e.jsx(ge,{})}),e.jsxs(f,{gap:4,children:[e.jsxs(f,{gap:4,alignItems:"center",children:[e.jsx(De,{type:ae,customField:n.customField}),e.jsxs(k,{textColor:"neutral800",fontWeight:"bold",textDecoration:p?"line-through":"none",ellipsis:!0,overflow:"hidden",children:[n.name,"required"in n&&n.required&&e.jsx(k,{textColor:"danger600",children:"* "})]})]}),e.jsx(f,{children:e.jsxs(k,{textColor:"neutral600",children:[e.jsx(We,{type:n.type,customField:n.customField,repeatable:"repeatable"in n&&n.repeatable,multiple:"multiple"in n&&n.multiple}),n.type==="relation"&&e.jsxs(e.Fragment,{children:[" (",me(n.relation,n.targetAttribute),") ",S&&h({id:x("modelPage.attribute.with"),defaultMessage:"with"})," ",S&&e.jsx(Y,{onClick:$=>$.stopPropagation(),tag:J,to:`/plugins/content-type-builder/content-types/${S.uid}`,children:P(S.info.displayName)}),V&&`(${h({id:x("from"),defaultMessage:"from"})}: ${V})`]}),n.type==="component"&&e.jsx(tt,{uid:n.component})]})})]})]}),e.jsx(g,{children:e.jsx(f,{justifyContent:"flex-end",gap:1,onClick:$=>$.stopPropagation(),children:e.jsxs(e.Fragment,{children:[e.jsx(g,{children:n.status&&e.jsx(Me,{status:n.status})}),["component","dynamiczone"].includes(n.type)&&e.jsx(U,{onClick:$=>{$.preventDefault(),$.stopPropagation(),u(!d)},"aria-expanded":d,label:h({id:"app.utils.toggle",defaultMessage:"Toggle"}),variant:"ghost",withTooltip:!1,children:e.jsx(fe,{"aria-hidden":!0,fill:"neutral500",style:{transform:`rotate(${d?"0deg":"-90deg"})`,transition:"transform 0.5s"}})}),M&&n.configurable!==!1?e.jsxs(e.Fragment,{children:[!C&&e.jsx(U,{onClick:W,label:`${h({id:"app.utils.edit",defaultMessage:"Edit"})} ${n.name}`,variant:"ghost",disabled:!H,children:e.jsx(K,{})}),e.jsx(U,{onClick:$=>{$.stopPropagation(),E({forTarget:i.modelType,targetUid:i.uid,attributeToRemoveName:n.name})},label:`${h({id:"global.delete",defaultMessage:"Delete"})} ${n.name}`,variant:"ghost",disabled:!le,children:e.jsx(he,{})})]}):e.jsx(f,{padding:2,children:e.jsx(xe,{fill:"neutral500"})})]})})})]}),e.jsxs(et,{$shouldHideNestedInfos:r,$isOpen:d,children:[n.type==="component"&&e.jsx(te,{...n,isFromDynamicZone:s,firstLoopComponentUid:o}),n.type==="dynamiczone"&&e.jsx(Je,{...n,disabled:j||n.status==="REMOVED",addComponent:l,forTarget:i.modelType,targetUid:i.uid})]})]})}),et=y(g)`
  display: ${({$shouldHideNestedInfos:t})=>t?"none":"block"};
  max-height: ${({$isOpen:t})=>t?"9999px":"0px"};
  overflow: hidden;

  transition: ${({$isOpen:t})=>t?"max-height 1s ease-in-out":"max-height 0.5s cubic-bezier(0, 1, 0, 1)"};
`,tt=({uid:t})=>{const{components:n}=D(),o=O(n,t);return e.jsxs(e.Fragment,{children:[" (",e.jsx(Y,{onClick:s=>s.stopPropagation(),tag:J,to:`/plugins/content-type-builder/component-categories/${o.category}/${o.uid}`,children:P(o.info.displayName)}),")"]})},ie=y(g)`
  height: 2.4rem;
  width: 2.4rem;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    height: 1rem;
    width: 1rem;
  }

  svg path {
    fill: ${({theme:t,color:n})=>t.colors[`${n}600`]};
  }
`,se=y(g)`
  border-radius: 0 0 ${({theme:t})=>t.borderRadius} ${({theme:t})=>t.borderRadius};
  display: block;
  width: 100%;
  border: none;
  position: relative;
`,nt=({children:t,icon:n,color:o,...s})=>e.jsx(se,{paddingBottom:4,paddingTop:4,paddingLeft:"6rem",tag:"button",type:"button",...s,children:e.jsxs(f,{children:[e.jsx(ie,{color:o,"aria-hidden":!0,background:`${o}200`,children:n}),e.jsx(g,{paddingLeft:3,children:e.jsx(k,{variant:"pi",fontWeight:"bold",textColor:`${o}600`,children:t})})]})}),ot=({children:t,icon:n,color:o,...s})=>e.jsxs("div",{children:[e.jsx(ye,{}),e.jsx(se,{tag:"button",background:`${o}100`,padding:5,...s,children:e.jsxs(f,{children:[e.jsx(ie,{color:o,"aria-hidden":!0,background:`${o}200`,children:n}),e.jsx(g,{paddingLeft:3,children:e.jsx(k,{variant:"pi",fontWeight:"bold",textColor:`${o}600`,children:t})})]})})]}),it=y(g)`
  white-space: nowrap;
  list-style: none;
  list-style-type: none;
`,st=t=>{const{isInDevelopmentMode:n}=D(),{isDragging:o,attributes:s,listeners:l,setNodeRef:a,transform:i,transition:c,setActivatorNodeRef:m}=Ne({disabled:!n||t.item.status==="REMOVED"||t.type.status==="REMOVED",id:t.item.id,data:{index:t.item.index}}),b={transform:Ue.Transform.toString({x:i?.x??0,y:i?.y??0,scaleX:1,scaleY:1}),transition:c};return e.jsx(oe,{ref:a,handleRef:m,isDragging:o,attributes:s,listeners:l,style:b,...t})},re=({addComponentToDZ:t,firstLoopComponentUid:n,isFromDynamicZone:o=!1,isMain:s=!1,isSub:l=!1,secondLoopComponentUid:a,type:i})=>{const{formatMessage:c}=A(),{trackUsage:m}=X(),{isInDevelopmentMode:b,moveAttribute:T}=D(),{onOpenModalAddField:r}=Z(),d=i?.attributes.map((p,C)=>({id:`${i.uid}_${p.name}`,index:C,...p})),[u,j]=F.useState(null),w=i?.status==="REMOVED",E=Re(Fe(Oe));function M({active:p}){p&&j(p.id)}function I(p){const{active:C,over:v}=p;j(null),v&&C.id!==v.id&&T({forTarget:i.modelType,targetUid:i.uid,from:C.data.current.index,to:v.data.current.index})}const R=d.find(p=>p.id===u),h=()=>{w||(m("hasClickedCTBAddFieldBanner"),r({forTarget:i?.modelType,targetUid:i.uid}))};return i?.attributes.length===0&&s?e.jsx(be,{action:e.jsx(B,{onClick:h,size:"L",startIcon:e.jsx(L,{}),variant:"secondary",children:c({id:x("table.button.no-fields"),defaultMessage:"Add new field"})}),content:c(i.modelType==="contentType"?{id:x("table.content.no-fields.collection-type"),defaultMessage:"Add your first field to this Collection-Type"}:{id:x("table.content.no-fields.component"),defaultMessage:"Add your first field to this component"}),hasRadius:!0,icon:e.jsx(je,{width:"16rem"})}):e.jsxs(Ae,{sensors:E,collisionDetection:Ee,onDragEnd:I,onDragStart:M,onDragCancel:()=>j(null),modifiers:[Be],children:[e.jsxs(it,{tag:"ul",children:[Ce.createPortal(e.jsx(Ie,{zIndex:10,children:R&&e.jsx(oe,{isOverlay:!0,item:R,firstLoopComponentUid:n,isFromDynamicZone:o,secondLoopComponentUid:a,type:i,addComponentToDZ:t})}),document.body),e.jsx(Se,{items:d,strategy:Le,children:d.map(p=>e.jsx(st,{item:p,firstLoopComponentUid:n,isFromDynamicZone:o,secondLoopComponentUid:a,type:i,addComponentToDZ:t},p.id))})]}),s&&b&&e.jsx(ot,{cursor:w?"normal":"pointer",icon:e.jsx(L,{}),onClick:h,color:w?"neutral":"primary",children:c({id:x(`form.button.add.field.to.${i.modelType==="component"?"component":i.kind}`),defaultMessage:"Add another field"})}),l&&b&&e.jsx(nt,{cursor:w?"normal":"pointer",icon:e.jsx(L,{}),onClick:h,color:o&&!w?"primary":"neutral",children:c({id:x("form.button.add.field.to.component"),defaultMessage:"Add another field"})})]})},z={collectionTypesConfigurations:[{action:"plugin::content-manager.collection-types.configure-view",subject:null}],componentsConfigurations:[{action:"plugin::content-manager.components.configure-layout",subject:null}],singleTypesConfigurations:[{action:"plugin::content-manager.single-types.configure-view",subject:null}]},rt=t=>t.modelType==="contentType"?t.kind==="singleType"?z.singleTypesConfigurations:z.collectionTypesConfigurations:z.componentsConfigurations,at=t=>{switch(t.modelType){case"contentType":switch(t.kind){case"singleType":return`/content-manager/single-types/${t.uid}/configurations/edit`;case"collectionType":return`/content-manager/collection-types/${t.uid}/configurations/edit`}case"component":return`/content-manager/components/${t.uid}/configurations/edit`}},lt=y(B)`
  white-space: nowrap;
`,dt=F.memo(({disabled:t,type:n})=>{const{formatMessage:o}=A(),s=we(),l=rt(n),a=o({id:"content-type-builder.form.button.configure-view",defaultMessage:"Configure the view"}),i=()=>{if(t)return!1;const b=at(n);return s(b),!1},{isLoading:c,allowedActions:m}=$e(l);return c||!m.canConfigureView&&!m.canConfigureLayout?null:e.jsx(lt,{startIcon:e.jsx(Te,{}),variant:"tertiary",onClick:i,disabled:t,children:a})}),ct=y(Q.Header)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`,Ct=()=>{const{isInDevelopmentMode:t,contentTypes:n,components:o,isLoading:s}=D(),{formatMessage:l}=A(),{trackUsage:a}=X(),{contentTypeUid:i,componentUid:c}=ve(),{onOpenModalAddComponentsToDZ:m,onOpenModalAddField:b,onOpenModalEditSchema:T}=Z(),r=i?n[i]:c?o[c]:null;if(s)return null;if(!r){const C=Object.values(n).filter(v=>v.visible===!0&&!v.plugin).map(v=>v.uid).sort();return C.length>0?e.jsx(_,{to:`/plugins/content-type-builder/content-types/${C[0]}`}):e.jsx(_,{to:"/plugins/content-type-builder/content-types/create-content-type"})}const d="plugin"in r&&r?.plugin!==void 0,u=i?"contentType":"component",j=r?.info?.displayName??"",w=t&&!d,E=C=>{m({dynamicZoneTarget:C,targetUid:r.uid})},M=()=>{if("kind"in r){r?.kind==="collectionType"&&a("willEditNameOfContentType"),r?.kind==="singleType"&&a("willEditNameOfSingleType"),T({modalType:u,forTarget:u,targetUid:r.uid,kind:r?.kind});return}T({modalType:u,forTarget:u,targetUid:r.uid})},I=l({id:x("table.button.no-fields"),defaultMessage:"Add new field"}),R=l({id:x("button.attributes.add.another"),defaultMessage:"Add another field"}),h=r.status==="REMOVED",p=t&&e.jsxs(f,{gap:2,children:[e.jsx(dt,{type:r,disabled:r.status==="NEW"||h},"link-to-cm-settings-view"),e.jsx(B,{startIcon:e.jsx(K,{}),variant:"tertiary",onClick:M,disabled:!w||h,children:l({id:"app.utils.edit",defaultMessage:"Edit"})}),e.jsx(B,{startIcon:e.jsx(L,{}),variant:"secondary",minWidth:"max-content",onClick:()=>{b({forTarget:u,targetUid:r.uid})},disabled:h,children:r.attributes.length===0?I:R})]});return e.jsxs(e.Fragment,{children:[h&&e.jsx(f,{background:"danger100",justifyContent:"center",padding:4,children:e.jsxs(f,{gap:2,children:[e.jsx(ke,{fill:"danger600",height:"2rem",width:"2rem"}),e.jsx(k,{children:l({id:x("table.warning.deleted"),defaultMessage:"This {kind} has been deleted"},{kind:r.modelType==="contentType"?"Content Type":"Component"})})]})}),e.jsx(ct,{id:"title",primaryAction:p,title:P(j)}),e.jsx(Q.Content,{children:e.jsx(g,{background:"neutral0",shadow:"filterShadow",hasRadius:!0,overflow:"auto",borderColor:"neutral150",children:e.jsx(re,{type:r,addComponentToDZ:E,isMain:!0})})})]})};export{Ct as default};
