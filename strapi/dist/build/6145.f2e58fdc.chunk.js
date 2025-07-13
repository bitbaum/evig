(self.webpackChunkstrapi_app=self.webpackChunkstrapi_app||[]).push([[6145],{4191:(W,G,a)=>{var n=a(87864),u=a(86386),h=a(45353),P=a(29884),O=a(74565),B=a(52689),v=a(48126),S=a(82388),z=a(82261);function q(te,oe,ke){oe.length?oe=n(oe,function(se){return z(se)?function(re){return u(re,se.length===1?se[0]:se)}:se}):oe=[S];var me=-1;oe=n(oe,B(h));var de=P(te,function(se,re,ae){var Ie=n(oe,function(Re){return Re(se)});return{criteria:Ie,index:++me,value:se}});return O(de,function(se,re){return v(se,re,ke)})}W.exports=q},7233:(W,G,a)=>{var n=a(97449);function u(h,P,O,B){return n(h,function(v,S,z){P(B,v,O(v),z)}),B}W.exports=u},14311:(W,G,a)=>{var n=a(32628),u=a(50633),h=a(91522),P=a(34827),O=a(49605),B="[object Map]",v="[object Set]";function S(z){if(z==null)return 0;if(h(z))return P(z)?O(z):z.length;var q=u(z);return q==B||q==v?z.size:n(z).length}W.exports=S},22171:(W,G,a)=>{var n=a(41225),u=a(52689),h=a(54765),P=h&&h.isRegExp,O=P?u(P):n;W.exports=O},29884:(W,G,a)=>{var n=a(97449),u=a(91522);function h(P,O){var B=-1,v=u(P)?Array(P.length):[];return n(P,function(S,z,q){v[++B]=O(S,z,q)}),v}W.exports=h},33999:(W,G,a)=>{var n=a(32193),u=n("length");W.exports=u},34827:(W,G,a)=>{var n=a(81204),u=a(82261),h=a(51646),P="[object String]";function O(B){return typeof B=="string"||!u(B)&&h(B)&&n(B)==P}W.exports=O},35336:(W,G,a)=>{var n=a(8928),u=a(88974),h=a(20598),P=a(57505),O=a(22171),B=a(49605),v=a(30660),S=a(88765),z=a(85306),q=30,te="...",oe=/\w*$/;function ke(me,de){var se=q,re=te;if(P(de)){var ae="separator"in de?de.separator:ae;se="length"in de?S(de.length):se,re="omission"in de?n(de.omission):re}me=z(me);var Ie=me.length;if(h(me)){var Re=v(me);Ie=Re.length}if(se>=Ie)return me;var xe=se-B(re);if(xe<1)return re;var je=Re?u(Re,0,xe).join(""):me.slice(0,xe);if(ae===void 0)return je+re;if(Re&&(xe+=je.length-xe),O(ae)){if(me.slice(xe).search(ae)){var gt,ne=je;for(ae.global||(ae=RegExp(ae.source,z(oe.exec(ae))+"g")),ae.lastIndex=0;gt=ae.exec(ne);)var st=gt.index;je=je.slice(0,st===void 0?xe:st)}}else if(me.indexOf(n(ae),xe)!=xe){var ft=je.lastIndexOf(ae);ft>-1&&(je=je.slice(0,ft))}return je+re}W.exports=ke},41225:(W,G,a)=>{var n=a(81204),u=a(51646),h="[object RegExp]";function P(O){return u(O)&&n(O)==h}W.exports=P},45635:(W,G,a)=>{var n=a(87212),u=a(4191),h=a(39226),P=a(3956),O=h(function(B,v){if(B==null)return[];var S=v.length;return S>1&&P(B,v[0],v[1])?v=[]:S>2&&P(v[0],v[1],v[2])&&(v=[v[0]]),u(B,n(v,1),[])});W.exports=O},48126:(W,G,a)=>{var n=a(64958);function u(h,P,O){for(var B=-1,v=h.criteria,S=P.criteria,z=v.length,q=O.length;++B<z;){var te=n(v[B],S[B]);if(te){if(B>=q)return te;var oe=O[B];return te*(oe=="desc"?-1:1)}}return h.index-P.index}W.exports=u},49605:(W,G,a)=>{var n=a(33999),u=a(20598),h=a(71387);function P(O){return u(O)?h(O):n(O)}W.exports=P},64958:(W,G,a)=>{var n=a(91662);function u(h,P){if(h!==P){var O=h!==void 0,B=h===null,v=h===h,S=n(h),z=P!==void 0,q=P===null,te=P===P,oe=n(P);if(!q&&!oe&&!S&&h>P||S&&z&&te&&!q&&!oe||B&&z&&te||!O&&te||!v)return 1;if(!B&&!S&&!oe&&h<P||oe&&O&&v&&!B&&!S||q&&O&&v||!z&&v||!te)return-1}return 0}W.exports=u},66145:(W,G,a)=>{"use strict";a.r(G),a.d(G,{A:()=>lt,C:()=>kt,a:()=>Je,g:()=>c,i:()=>$d,u:()=>ze});var n=a(92132),u=a(21272),h=a(44370),P=a(43274),O=a(27026),B=a(80846),v=a(43242),S=a(57842),z=a(76106),q=a(57564),te=a(68065),oe=a(93744),ke=a(53900),me=a(15926),de=a(44622),se=a(24122),re=a(83724),ae=a(45024),Ie=a(89787),Re=a(35089),xe=a(12050),je=a(81926),gt=a(72171),ne=a(69564),st=a(6479),ft=a(91894),Ns=a(41516),Is=a(96586),Rs=a(17122),Es=a(18670),sn=a(19106),ws=a(42035),Ds=a(71262),Os=a(37373),Bs=a(168),Ps=a(50642),ks=a(32161),Ws=a(53432),F=a(18181),zs=a(14718),Y=a(49687),an=a(56428),Fe=a(63126),w=a(94929);const Ee=(e,t,s)=>{if(!t)return;if(typeof t=="object")return(Array.isArray(t)?t:[t?.desktop,t?.tablet,t?.mobile]).reduce((i,d,g)=>{if(d)switch(g){case 0:return`${i}${e}: ${s.spaces[d]};`;case 1:return`${i}${s.mediaQueries.tablet}{${e}: ${s.spaces[d]};}`;case 2:return`${i}${s.mediaQueries.mobile}{${e}: ${s.spaces[d]};}`;default:return i}return i},"");const r=s.spaces[t]??t;return`${e}: ${r};`};function Us(e,t){return typeof e=="string"?!1:t in e}function Zd(e){return e&&typeof e=="object"&&!Array.isArray(e)}function ie(e,t,s){return t&&Us(e,t)?e[t]:s}const Vs={color:!0,cursor:!0,height:!0,width:!0},K=w.Ay.div.withConfig({shouldForwardProp:(e,t)=>!Vs[e]&&t(e)})`
  // Font
  font-size: ${({fontSize:e,theme:t})=>ie(t.fontSizes,e,e)};

  // Colors
  background: ${({theme:e,background:t})=>ie(e.colors,t,t)};
  color: ${({theme:e,color:t})=>ie(e.colors,t,void 0)};

  // Spaces
  ${({theme:e,padding:t})=>Ee("padding",t,e)}
  ${({theme:e,paddingTop:t})=>Ee("padding-top",t,e)}
  ${({theme:e,paddingRight:t})=>Ee("padding-right",t,e)}
  ${({theme:e,paddingBottom:t})=>Ee("padding-bottom",t,e)}
  ${({theme:e,paddingLeft:t})=>Ee("padding-left",t,e)}
  ${({theme:e,marginLeft:t})=>Ee("margin-left",t,e)}
  ${({theme:e,marginRight:t})=>Ee("margin-right",t,e)}
  ${({theme:e,marginTop:t})=>Ee("margin-top",t,e)}
  ${({theme:e,marginBottom:t})=>Ee("margin-bottom",t,e)}

  // Responsive hiding
  ${({theme:e,hiddenS:t})=>t?`${e.mediaQueries.tablet} { display: none; }`:void 0}
  ${({theme:e,hiddenXS:t})=>t?`${e.mediaQueries.mobile} { display: none; }`:void 0}
  

  // Borders
  border-radius: ${({theme:e,hasRadius:t,borderRadius:s})=>t?e.borderRadius:s};
  border-style: ${({borderStyle:e})=>e};
  border-width: ${({borderWidth:e})=>e};
  border-color: ${({borderColor:e,theme:t})=>ie(t.colors,e,void 0)};
  border: ${({theme:e,borderColor:t,borderStyle:s,borderWidth:r})=>{if(t&&!s&&typeof r>"u")return`1px solid ${e.colors[t]}`}};

  // Shadows
  box-shadow: ${({theme:e,shadow:t})=>ie(e.shadows,t,void 0)};

  // Handlers
  pointer-events: ${({pointerEvents:e})=>e};
  &:hover {
    ${({_hover:e,theme:t})=>e?e(t):void 0}
  }

  // Display
  display: ${({display:e})=>e};

  // Position
  position: ${({position:e})=>e};
  left: ${({left:e,theme:t})=>ie(t.spaces,e,e)};
  right: ${({right:e,theme:t})=>ie(t.spaces,e,e)};
  top: ${({top:e,theme:t})=>ie(t.spaces,e,e)};
  bottom: ${({bottom:e,theme:t})=>ie(t.spaces,e,e)};
  z-index: ${({zIndex:e})=>e};
  overflow: ${({overflow:e})=>e};

  // Size
  width: ${({width:e,theme:t})=>ie(t.spaces,e,e)};
  max-width: ${({maxWidth:e,theme:t})=>ie(t.spaces,e,e)};
  min-width: ${({minWidth:e,theme:t})=>ie(t.spaces,e,e)};
  height: ${({height:e,theme:t})=>ie(t.spaces,e,e)};
  max-height: ${({maxHeight:e,theme:t})=>ie(t.spaces,e,e)};
  min-height: ${({minHeight:e,theme:t})=>ie(t.spaces,e,e)};

  // Animation
  transition: ${({transition:e})=>e};
  transform: ${({transform:e})=>e};
  animation: ${({animation:e})=>e};

  //Flexbox children props
  flex-shrink: ${({shrink:e})=>e};
  flex-grow: ${({grow:e})=>e};
  flex-basis: ${({basis:e})=>e};
  flex: ${({flex:e})=>e};

  // Text
  text-align: ${({textAlign:e})=>e};
  text-transform: ${({textTransform:e})=>e};
  line-height: ${({theme:e,lineHeight:t})=>ie(e.lineHeights,t,t)};

  // Cursor
  cursor: ${({cursor:e})=>e};
`,Zs=(0,w.Ay)(K)`
  display: grid;
  grid-template-columns: repeat(${({gridCols:e})=>e}, 1fr);
  ${({theme:e,gap:t})=>Ee("gap",t,e)}
`,Hs=e=>{const{gap:t="0",gridCols:s=12,...r}=e;return(0,n.jsx)(Zs,{gap:t,gridCols:s,...r})},Gs=`${232/16}rem`,Ys=(0,w.Ay)(Hs)`
  width: ${Gs};
  background: ${({theme:e})=>e.colors.neutral100};
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid ${({theme:e})=>e.colors.neutral200};
  z-index: 1;
`,Ks=({ariaLabel:e,...t})=>(0,n.jsx)(Ys,{"aria-label":e,as:"nav",...t});var ht=a(67067);const Qs={DOWN:"ArrowDown",UP:"ArrowUp",RIGHT:"ArrowRight",LEFT:"ArrowLeft",ESCAPE:"Escape",ENTER:"Enter",SPACE:" ",TAB:"Tab",END:"End",HOME:"Home",DELETE:"Delete",PAGE_UP:"PageUp",PAGE_DOWN:"PageDown",BACKSPACE:"Backspace",CLEAR:"Clear"},Xs=u["useId".toString()]||(()=>{});let Js=0;const qe=e=>{const[t,s]=(0,u.useState)(Xs());return(0,u.useLayoutEffect)(()=>{e||s(r=>r??String(Js++))},[e]),e?.toString()??(t||"")},qs=e=>{const t=(0,u.useRef)();return(0,u.useEffect)(()=>{t.current=e}),t.current},_s=(0,w.Ay)(K)`
  height: 1px;
  border: none;
  /* If contained in a Flex parent we want to prevent the Divider to shink */
  flex-shrink: 0;
  ${({unsetMargin:e})=>e?"margin: 0;":""}
`,ea=({unsetMargin:e=!0,...t})=>(0,n.jsx)(_s,{...t,background:"neutral150",as:"hr",unsetMargin:e}),ta=e=>(0,n.jsx)("form",{...e,role:"search"});var na=a(98889);function sa(e,t){typeof e=="function"?e(t):e!=null&&(e.current=t)}function on(...e){return t=>e.forEach(s=>sa(s,t))}function Hd(...e){return React.useCallback(on(...e),e)}const Gd=e=>({theme:t,size:s})=>t.sizes[e][s],rn=(e="&")=>({theme:t,hasError:s=!1})=>(0,w.AH)`
    outline: none;
    box-shadow: 0;
    transition-property: border-color, box-shadow, fill;
    transition-duration: 0.2s;

    ${e}:focus-within {
      border: 1px solid ${s?t.colors.danger600:t.colors.primary600};
      box-shadow: ${s?t.colors.danger600:t.colors.primary600} 0px 0px 0px 2px;
    }
  `,ln=({theme:e})=>(0,w.AH)`
  position: relative;
  outline: none;

  &:after {
    transition-property: all;
    transition-duration: 0.2s;
    border-radius: 8px;
    content: '';
    position: absolute;
    top: -4px;
    bottom: -4px;
    left: -4px;
    right: -4px;
    border: 2px solid transparent;
  }

  &:focus-visible {
    outline: none;
    &:after {
      border-radius: 8px;
      content: '';
      position: absolute;
      top: -5px;
      bottom: -5px;
      left: -5px;
      right: -5px;
      border: 2px solid ${e.colors.primary600};
    }
  }
`,dn=(0,u.createContext)({id:"",required:!1}),cn=()=>(0,u.useContext)(dn),aa={direction:!0},ce=(0,w.Ay)(K).withConfig({shouldForwardProp:(e,t)=>!aa[e]&&t(e)})`
  align-items: ${({alignItems:e="center"})=>e};
  display: ${({display:e="flex",inline:t})=>t?"inline-flex":e};
  flex-direction: ${({direction:e="row"})=>e};
  flex-shrink: ${({shrink:e})=>e};
  flex-wrap: ${({wrap:e})=>e};
  ${({gap:e,theme:t})=>Ee("gap",e,t)};
  justify-content: ${({justifyContent:e})=>e};
`,un={S:6.5,M:10.5},oa=(0,u.forwardRef)(({endAction:e,startAction:t,disabled:s=!1,onChange:r,size:o="M",...l},i)=>{const{id:d,error:g,hint:m,name:f,required:p}=cn();let T;g?T=`${d}-error`:m&&(T=`${d}-hint`);const C=Boolean(g),b=M=>{!s&&r&&r(M)};return(0,n.jsxs)(Tt,{justifyContent:"space-between",hasError:C,disabled:s,children:[t?(0,n.jsx)(K,{paddingLeft:3,paddingRight:2,children:t}):null,(0,n.jsx)(ra,{id:d,name:f,ref:i,"aria-describedby":T,"aria-invalid":C,"aria-disabled":s,disabled:s,"data-disabled":s?"":void 0,hasLeftAction:Boolean(t),hasRightAction:Boolean(e),onChange:b,"aria-required":p,$size:o,...l}),e?(0,n.jsx)(K,{paddingLeft:2,paddingRight:3,children:e}):null]})}),ra=w.Ay.input`
  border: none;
  border-radius: ${({theme:e})=>e.borderRadius};
  padding-bottom: ${({$size:e})=>`${un[e]/16}rem`};
  padding-left: ${({theme:e,hasLeftAction:t})=>t?0:e.spaces[4]};
  padding-right: ${({theme:e,hasRightAction:t})=>t?0:e.spaces[4]};
  padding-top: ${({$size:e})=>`${un[e]/16}rem`};
  cursor: ${e=>e["aria-disabled"]?"not-allowed":void 0};

  color: ${({theme:e})=>e.colors.neutral800};
  font-weight: 400;
  font-size: ${e=>e.theme.fontSizes[2]};
  display: block;
  width: 100%;
  background: inherit;

  ::placeholder {
    color: ${({theme:e})=>e.colors.neutral500};
    opacity: 1;
  }

  &[aria-disabled='true'] {
    color: inherit;
  }

  //focus managed by InputWrapper
  &:focus {
    outline: none;
    box-shadow: none;
  }
`,Tt=(0,w.Ay)(ce)`
  border: 1px solid ${({theme:e,hasError:t})=>t?e.colors.danger600:e.colors.neutral200};
  border-radius: ${({theme:e})=>e.borderRadius};
  background: ${({theme:e})=>e.colors.neutral0};
  ${rn()}

  ${({theme:e,disabled:t})=>t?(0,w.AH)`
          color: ${e.colors.neutral600};
          background: ${e.colors.neutral150};
        `:void 0}
`,yt=w.Ay.div`
  border: 0;
  clip: rect(0 0 0 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
`,ia=(0,w.Ay)(ce)`
  font-size: 1.6rem;
  padding: 0;
`,la=(0,u.forwardRef)(({label:e,children:t,...s},r)=>(0,n.jsxs)(ia,{justifyContent:"unset",background:"transparent",borderStyle:"none",type:"button",...s,as:"button",ref:r,children:[(0,n.jsx)(yt,{as:"span",children:e}),(0,u.cloneElement)(t,{"aria-hidden":!0,focusable:!1})]})),da=(0,u.forwardRef)(({children:e,name:t,error:s,hint:r,id:o,required:l=!1,...i},d)=>{const g=qe(o),m=(0,u.useMemo)(()=>({name:t,id:g,error:s,hint:r,required:l}),[s,g,r,t,l]);return(0,n.jsx)(K,{ref:d,...i,children:(0,n.jsx)(dn.Provider,{value:m,children:e})})}),ca="[@strapi/design-system]:",ua=e=>{const t=e;let s=!1;if(typeof t!="function")throw new TypeError(`${ca} once requires a function parameter`);return(...r)=>{s||(t(...r),s=!0)}},mn="alpha",pn="beta",gn="delta",fn="epsilon",Mt="omega",hn="pi",yn="sigma",Yd=[mn,pn,gn,fn,Mt,hn,yn],ma=({ellipsis:e=!1})=>e&&`
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `,pa=({variant:e=Mt,theme:t})=>{switch(e){case mn:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[5]};
        line-height: ${t.lineHeights[2]};
      `;case pn:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[4]};
        line-height: ${t.lineHeights[1]};
      `;case gn:return`
        font-weight: ${t.fontWeights.semiBold};
        font-size: ${t.fontSizes[3]};
        line-height: ${t.lineHeights[2]};
      `;case fn:return`
        font-size: ${t.fontSizes[3]};
        line-height: ${t.lineHeights[6]};
      `;case Mt:return`
        font-size: ${t.fontSizes[2]};
        line-height: ${t.lineHeights[4]};
      `;case hn:return`
        font-size: ${t.fontSizes[1]};
        line-height: ${t.lineHeights[3]};
      `;case yn:return`
        font-weight: ${t.fontWeights.bold};
        font-size: ${t.fontSizes[0]};
        line-height: ${t.lineHeights[5]};
        text-transform: uppercase;
      `;default:return`
        font-size: ${t.fontSizes[2]};
      `}},ga={fontSize:!0,fontWeight:!0},X=w.Ay.span.withConfig({shouldForwardProp:(e,t)=>!ga[e]&&t(e)})`
  ${pa}
  ${ma}

  // These properties need to come after {variantStyle}, because they might
  // overwrite a variant attribute
  font-weight: ${({theme:e,fontWeight:t})=>ie(e.fontWeights,t,void 0)};
  font-size: ${({theme:e,fontSize:t})=>ie(e.fontSizes,t,void 0)};
  line-height: ${({theme:e,lineHeight:t})=>ie(e.lineHeights,t,t)};
  color: ${({theme:e,textColor:t})=>e.colors[t||"neutral800"]};
  text-align: ${({textAlign:e})=>e};
  text-decoration: ${({textDecoration:e})=>e};
  text-transform: ${({textTransform:e})=>e};
`,fa=ua(console.warn),ha=(0,u.forwardRef)(({children:e,action:t,required:s,...r},o)=>{const{id:l,required:i}=cn(),d=i||s;return s!==void 0&&fa('Deprecation warning: Usage of "required" prop in FieldLabel component is deprecated. This is discouraged and will be removed in the next major release. Please use the Field component to share the required prop.'),(0,n.jsxs)(ya,{ref:o,variant:"pi",textColor:"neutral800",htmlFor:l,fontWeight:"bold",as:"label",...r,children:[e,d&&(0,n.jsx)(xa,{textColor:"danger600",children:"*"}),t&&(0,n.jsx)(ba,{marginLeft:1,children:t})]})}),ya=(0,w.Ay)(X)`
  display: flex;
  align-items: center;
`,xa=(0,w.Ay)(X)`
  line-height: 0;
`,ba=(0,w.Ay)(ce)`
  line-height: 0;

  svg path {
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`,va=(0,w.Ay)(na.A)`
  font-size: 0.5rem;
  path {
    fill: ${({theme:e})=>e.colors.neutral400};
  }
`,xn=(0,w.Ay)(ht.A)`
  font-size: 0.8rem;
  path {
    fill: ${({theme:e})=>e.colors.neutral800};
  }
`,Aa=w.Ay.div`
  border-radius: ${({theme:e})=>e.borderRadius};
  box-shadow: ${({theme:e})=>e.shadows.filterShadow};

  &:focus-within {
    ${xn} {
      path {
        fill: ${({theme:e})=>e.colors.primary600};
      }
    }
  }

  ${Tt} {
    border: 1px solid transparent;
  }

  ${rn(Tt)}
`,Ca=(0,u.forwardRef)(({name:e,size:t="M",children:s,value:r="",onClear:o,clearLabel:l,...i},d)=>{const g=(0,u.useRef)(null),m=r.length>0,f=T=>{o(T),g.current.focus()},p=on(d,g);return(0,n.jsx)(Aa,{children:(0,n.jsxs)(da,{name:e,children:[(0,n.jsx)(yt,{children:(0,n.jsx)(ha,{children:s})}),(0,n.jsx)(oa,{ref:p,value:r,startAction:(0,n.jsx)(xn,{"aria-hidden":!0}),size:t,endAction:m?(0,n.jsx)(la,{label:l,onClick:f,children:(0,n.jsx)(va,{})}):void 0,...i})]})})}),ja=e=>{const[t,s]=(0,u.useState)(!1),r=(0,u.useRef)(null),o=()=>{typeof r.current=="number"&&(clearTimeout(r.current),r.current=null)};return(0,u.useEffect)(()=>()=>{o()},[]),{visible:t,onFocus:()=>{s(!0)},onBlur:()=>{s(!1)},onMouseEnter:()=>{r.current=setTimeout(()=>{s(!0)},e)},onMouseLeave:()=>{o(),s(!1)}}},Ze=8,Ta=(e,t)=>{const s=(e.width-t.width)/2,r=t.left-s,o=t.top+t.height+Ze+window.pageYOffset;return{left:r,top:o}},Ma=(e,t)=>{const s=(e.height-t.height)/2,r=t.left+t.width+Ze,o=t.top-s+window.pageYOffset;return{left:r,top:o}},$a=(e,t)=>{const s=(e.height-t.height)/2,r=t.left-e.width-Ze,o=t.top-s+window.pageYOffset;return{left:r,top:o}},Sa=(e,t)=>{const s=(e.width-t.width)/2;let r=t.left-s,o=t.top-e.height-Ze+window.pageYOffset;const l=window.innerWidth-t.right;return t.left+e.width-l>window.innerWidth?(r=t.left-e.width-Ze,o=t.top+window.scrollY-t.height/2):r<0?(r=t.width+t.left+Ze,o=t.top+window.scrollY-e.height/2+Ze):o<0&&r>0&&(o=t.top+t.height+Ze),{left:r,top:o}},Fa=(e,t,s)=>{const r=e.getBoundingClientRect(),o=t.getBoundingClientRect();return s==="bottom"?Ta(r,o):s==="right"?Ma(r,o):s==="left"?$a(r,o):Sa(r,o)},La=(e,t)=>{const s=(0,u.useRef)(null),r=(0,u.useRef)(null);return(0,u.useLayoutEffect)(()=>{if(e){const o=s.current,l=r.current;if(o&&l){const i=Fa(o,l,t);o.style.left=`${i.left}px`,o.style.top=`${i.top}px`}}},[t,e]),{tooltipWrapperRef:s,toggleSourceRef:r}};var Na=a(26509);const bn=u.forwardRef(({container:e=globalThis?.document?.body,...t},s)=>e?(0,Na.createPortal)((0,n.jsx)(K,{ref:s,...t}),e):null);bn.displayName="Portal";const Ia=(0,w.Ay)(K)`
  /* z-index exist because of its position inside Modals */
  z-index: 4;
  display: ${({visible:e})=>e?"revert":"none"};
`,Ra=({children:e,label:t,description:s,delay:r=500,position:o="top",id:l,...i})=>{const d=qe(l),g=qe(),{visible:m,...f}=ja(r),{tooltipWrapperRef:p,toggleSourceRef:T}=La(m,o),C=u.cloneElement(e,{tabIndex:0,"aria-labelledby":t?d:void 0,"aria-describedby":s?d:void 0,...f});return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(bn,{children:(0,n.jsxs)(Ia,{id:d,background:"neutral900",hasRadius:!0,padding:2,role:"tooltip",ref:p,visible:m,position:"absolute",...i,children:[m&&(0,n.jsx)(yt,{id:g,children:s}),(0,n.jsx)(X,{as:"p",variant:"pi",fontWeight:"bold",textColor:"neutral0",children:t||s})]})}),(0,n.jsx)("span",{ref:T,children:C})]})},Ea=(0,w.Ay)(ce)`
  > svg {
    height: ${({theme:e})=>e.spaces[3]};
    width: ${({theme:e})=>e.spaces[3]};

    > g,
    path {
      fill: ${({theme:e})=>e.colors.neutral0};
    }
  }

  &[aria-disabled='true'] {
    pointer-events: none;
  }

  ${ln}
`,$t=u.forwardRef(({disabled:e,children:t,background:s="neutral0",...r},o)=>(0,n.jsx)(Ea,{ref:o,"aria-disabled":e,as:"button",type:"button",disabled:e,padding:2,hasRadius:!0,background:s,borderColor:"neutral200",cursor:"pointer",...r,children:t}));$t.displayName="BaseButton";const wa="tertiary",at="secondary",Da=["S","M","L"],Oa=[wa,at],Ba=u.forwardRef(({label:e,background:t,borderWidth:s,noBorder:r=!1,children:o,icon:l,disabled:i=!1,onClick:d,size:g=Da[0],"aria-label":m,variant:f=Oa[0],...p},T)=>{const C=M=>{!i&&d&&d(M)},b=(0,n.jsxs)(vn,{"aria-disabled":i,background:i?"neutral150":t,borderWidth:r?0:s,justifyContent:"center",...p,ref:T,size:g,onClick:C,variant:f,children:[(0,n.jsx)(yt,{as:"span",children:e??m}),u.cloneElement(l||o,{"aria-hidden":!0,focusable:!1})]});return e?(0,n.jsx)(Ra,{label:e,children:b}):b}),vn=(0,w.Ay)($t)`
  background-color: ${({theme:e,variant:t})=>{if(t===at)return e.colors.primary100}};
  border-color: ${({theme:e,variant:t})=>t===at?e.colors.primary200:e.colors.neutral200};
  height: ${({theme:e,size:t})=>e.sizes.button[t]};
  width: ${({theme:e,size:t})=>e.sizes.button[t]};

  svg {
    g,
    path {
      fill: ${({theme:e,variant:t})=>t===at?e.colors.primary500:e.colors.neutral500};
    }
  }

  :hover,
  :focus {
    svg {
      g,
      path {
        fill: ${({theme:e,variant:t})=>t===at?e.colors.primary600:e.colors.neutral600};
      }
    }
  }

  &[aria-disabled='true'] {
    svg {
      path {
        fill: ${({theme:e})=>e.colors.neutral600};
      }
    }
  }
`,Kd=(0,w.Ay)(ce)`
  & span:first-child button {
    border-left: 1px solid ${({theme:e})=>e.colors.neutral200};
    border-radius: ${({theme:e})=>`${e.borderRadius} 0 0 ${e.borderRadius}`};
  }

  & span:last-child button {
    border-radius: ${({theme:e})=>`0 ${e.borderRadius} ${e.borderRadius} 0`};
  }

  & ${vn} {
    border-radius: 0;
    border-left: none;

    svg {
      path {
        fill: ${({theme:e})=>e.colors.neutral700};
      }
    }

    &:hover {
      background-color: ${({theme:e})=>e.colors.neutral100};

      svg {
        path {
          fill: ${({theme:e})=>e.colors.neutral800};
        }
      }
    }

    &:active {
      background-color: ${({theme:e})=>e.colors.neutral150};
      svg {
        path {
          fill: ${({theme:e})=>e.colors.neutral900};
        }
      }
    }

    &[aria-disabled='true'] {
      svg {
        path {
          fill: ${({theme:e})=>e.colors.neutral600};
        }
      }
    }
  }
`,An=(0,w.Ay)(ea)`
  width: ${24/16}rem;
  background-color: ${({theme:e})=>e.colors.neutral200};
`,Pa=({as:e="h2",label:t,searchLabel:s="",searchable:r=!1,onChange:o=()=>{},value:l="",onClear:i=()=>{},onSubmit:d=()=>{},id:g})=>{const[m,f]=(0,u.useState)(!1),p=qs(m),T=qe(g),C=(0,u.useRef)(void 0),b=(0,u.useRef)(void 0);(0,u.useEffect)(()=>{m&&C.current&&C.current.focus(),p&&!m&&b.current&&b.current.focus()},[m,p]);const M=()=>{f(N=>!N)},U=N=>{i(N),C.current.focus()},$=N=>{N.relatedTarget?.id!==T&&f(!1)},L=N=>{N.key===Qs.ESCAPE&&f(!1)};return m?(0,n.jsxs)(K,{paddingLeft:4,paddingTop:5,paddingBottom:2,paddingRight:4,children:[(0,n.jsx)(ta,{children:(0,n.jsx)(Ca,{name:"searchbar",value:l,onChange:o,placeholder:"e.g: strapi-plugin-abcd",onKeyDown:L,ref:C,onBlur:$,onClear:U,onSubmit:d,clearLabel:"Clear",size:"S",children:s})}),(0,n.jsx)(K,{paddingLeft:2,paddingTop:4,children:(0,n.jsx)(An,{})})]}):(0,n.jsxs)(K,{paddingLeft:6,paddingTop:6,paddingBottom:2,paddingRight:4,children:[(0,n.jsxs)(ce,{justifyContent:"space-between",alignItems:"flex-start",children:[(0,n.jsx)(X,{variant:"beta",as:e,children:t}),r&&(0,n.jsx)(Ba,{ref:b,onClick:M,label:s,icon:(0,n.jsx)(ht.A,{})})]}),(0,n.jsx)(K,{paddingTop:4,children:(0,n.jsx)(An,{})})]})},ka=({children:e,spacing:t=2,horizontal:s=!1,...r})=>(0,n.jsx)(K,{paddingTop:2,paddingBottom:4,children:(0,n.jsx)(ce,{as:"ol",gap:t,direction:s?"row":"column",alignItems:s?"center":"stretch",...r,children:u.Children.map(e,(o,l)=>(0,n.jsx)("li",{children:o},l))})});var St=a(28556);const Cn=(0,w.Ay)(ce)`
  border: none;
  padding: 0;
  background: transparent;
`,Wa=w.Ay.div`
  display: flex;
  align-items: center;
  transform: rotateX(${({rotated:e})=>e?"0deg":"180deg"});
`,za=({collapsable:e=!1,label:t,onClick:s=()=>{},ariaExpanded:r,ariaControls:o})=>e?(0,n.jsxs)(Cn,{as:"button",onClick:s,"aria-expanded":r,"aria-controls":o,textAlign:"left",children:[(0,n.jsx)(K,{paddingRight:1,children:(0,n.jsx)(X,{variant:"sigma",textColor:"neutral600",children:t})}),e&&(0,n.jsx)(Wa,{rotated:r,children:(0,n.jsx)(St.A,{"aria-hidden":!0})})]}):(0,n.jsx)(Cn,{children:(0,n.jsx)(K,{paddingRight:1,children:(0,n.jsx)(X,{variant:"sigma",textColor:"neutral600",children:t})})}),Ua=(0,w.Ay)(ce)`
  border-radius: ${({theme:e,size:t})=>t==="S"?"2px":e.borderRadius};
  height: ${({size:e,theme:t})=>t.sizes.badge[e]};
`,Va=({active:e=!1,size:t="M",textColor:s="neutral600",backgroundColor:r="neutral150",children:o,minWidth:l=5,...i})=>{const d=t==="S"?1:2;return(0,n.jsx)(Ua,{inline:!0,alignItem:"center",justifyContent:"center",minWidth:l,paddingLeft:d,paddingRight:d,background:e?"primary200":r,size:t,...i,children:(0,n.jsx)(X,{variant:"sigma",textColor:e?"primary600":s,children:o})})},Za=(0,w.Ay)(K)`
  svg {
    height: ${4/16}rem;
    path {
      fill: ${({theme:e})=>e.colors.neutral500};
    }
  }
`,Ha=({collapsable:e=!1,label:t,badgeLabel:s,children:r,id:o})=>{const[l,i]=(0,u.useState)(!0),d=qe(o),g=()=>{i(m=>!m)};return(0,n.jsxs)(ce,{direction:"column",alignItems:"stretch",gap:1,children:[(0,n.jsx)(Za,{paddingLeft:6,paddingTop:2,paddingBottom:2,paddingRight:4,children:(0,n.jsxs)(K,{position:"relative",paddingRight:s?6:0,children:[(0,n.jsx)(za,{onClick:g,ariaExpanded:l,ariaControls:d,collapsable:e,label:t}),s&&(0,n.jsx)(Va,{backgroundColor:"neutral150",textColor:"neutral600",position:"absolute",right:0,top:"50%",transform:"translateY(-50%)",children:s})]})}),(!e||l)&&(0,n.jsx)("ol",{id:d,children:u.Children.map(r,(m,f)=>(0,n.jsx)("li",{children:m},f))})]})},Ga=(0,w.Ay)(K)`
  svg {
    height: ${4/16}rem;
    path {
      fill: ${({theme:e})=>e.colors.neutral700};
    }
  }
`,Ya=w.Ay.button`
  border: none;
  padding: 0;
  background: transparent;
  display: flex;
  align-items: center;
`,Ka=w.Ay.div`
  display: flex;
  align-items: center;
  width: ${12/16}rem;
  transform: rotateX(${({rotated:e})=>e?"0deg":"180deg"});
`,Qa=({label:e,children:t,id:s})=>{const[r,o]=(0,u.useState)(!0),l=qe(s),i=()=>{o(d=>!d)};return(0,n.jsxs)(K,{children:[(0,n.jsx)(Ga,{paddingLeft:7,paddingTop:2,paddingBottom:2,paddingRight:4,children:(0,n.jsx)(ce,{justifyContent:"space-between",children:(0,n.jsxs)(Ya,{onClick:i,"aria-expanded":r,"aria-controls":l,children:[(0,n.jsx)(Ka,{rotated:r,children:(0,n.jsx)(St.A,{"aria-hidden":!0})}),(0,n.jsx)(K,{paddingLeft:2,children:(0,n.jsx)(X,{as:"span",fontWeight:"semiBold",textColor:"neutral800",children:e})})]})})}),r&&(0,n.jsx)("ul",{id:l,children:u.Children.map(t,(d,g)=>(0,n.jsx)("li",{children:d},g))})]})};var Xa=a(47576);const Ft=u.forwardRef(({href:e,rel:t="noreferrer noopener",target:s="_self",disabled:r=!1,isExternal:o=!1,...l},i)=>(0,n.jsx)(K,{as:"a",ref:i,target:o?"_blank":s,rel:o?t:void 0,href:r?"#":e,"aria-disabled":r,cursor:"pointer",...l}));Ft.displayName="BaseLink";const Ja=(0,w.Ay)(K)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: ${({theme:e})=>e.colors.neutral800};
  svg > * {
    fill: ${({theme:e})=>e.colors.neutral600};
  }

  &.active {
    ${({theme:e})=>`
      background-color: ${e.colors.primary100};
      border-right: 2px solid ${e.colors.primary600};
      svg > * {
        fill: ${e.colors.primary700};
      }
      ${X} {
        color: ${e.colors.primary700};
        font-weight: 500;
      }
      `}
  }

  &:focus-visible {
    outline-offset: -2px;
  }
`,jn=(0,w.Ay)(Xa.A)`
  width: ${12/16}rem;
  height: ${4/16}rem;
  * {
    fill: ${({theme:e,$active:t})=>t?e.colors.primary600:e.colors.neutral600};
  }
`,qa=w.Ay.div`
  svg {
    height: ${12/16}rem;
    width: ${12/16}rem;
  }
`,Tn=u.forwardRef(({children:e,icon:t=null,withBullet:s=!1,as:r=Ft,isSubSectionChild:o=!1,...l},i)=>(0,n.jsxs)(Ja,{as:r,icon:t,background:"neutral100",paddingLeft:o?9:7,paddingBottom:2,paddingTop:2,ref:i,...l,children:[(0,n.jsxs)(ce,{children:[t?(0,n.jsx)(qa,{children:t}):(0,n.jsx)(jn,{}),(0,n.jsx)(K,{paddingLeft:2,children:(0,n.jsx)(X,{as:"span",children:e})})]}),s&&(0,n.jsx)(K,{as:ce,paddingRight:4,children:(0,n.jsx)(jn,{$active:!0})})]}));var _a=a(44010);const eo=(0,w.Ay)(Ft)`
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  gap: ${({theme:e})=>e.spaces[2]};
  pointer-events: ${({disabled:e})=>e?"none":void 0};

  svg {
    font-size: ${10/16}rem;

    path {
      fill: ${({disabled:e,theme:t})=>e?t.colors.neutral600:t.colors.primary600};
    }
  }

  &:hover {
    color: ${({theme:e})=>e.colors.primary500};
  }

  &:active {
    color: ${({theme:e})=>e.colors.primary700};
  }

  ${ln};
`,xt=u.forwardRef(({children:e,href:t,disabled:s=!1,startIcon:r,endIcon:o,isExternal:l=!0,...i},d)=>(0,n.jsxs)(eo,{ref:d,href:t,disabled:s,isExternal:l,...i,children:[r,(0,n.jsx)(X,{textColor:s?"neutral600":"primary600",children:e}),o,t&&!o&&l&&(0,n.jsx)(_a.A,{})]}));xt.displayName="Link";const Mn=()=>(0,n.jsx)(K,{"aria-hidden":!0,paddingLeft:1,paddingRight:1,children:(0,n.jsx)(X,{variant:"pi",textColor:"neutral500",children:"/"})});Mn.displayName="Divider";const to=(0,w.Ay)(ce)`
  // CrumbLinks do have padding-x, because they need to have a
  // interaction effect, which mis-aligns the breadcrumbs on the left.
  // This normalizes the behavior by moving the first item to left by
  // the same amount it has inner padding
  :first-child {
    margin-left: ${({theme:e})=>`calc(-1*${e.spaces[2]})`};
  }
`,$n=({label:e,children:t,...s})=>{const r=u.Children.toArray(t);return(0,n.jsx)(K,{"aria-label":e,...s,children:(0,n.jsx)(to,{as:"ol",children:u.Children.map(r,(o,l)=>{const i=r.length>1&&l+1<r.length;return(0,n.jsxs)(ce,{inline:!0,as:"li",children:[o,i&&(0,n.jsx)(Mn,{})]})})})})};$n.displayName="Breadcrumbs";const Sn=({children:e,isCurrent:t=!1,...s})=>(0,n.jsx)(K,{paddingLeft:2,paddingRight:2,paddingTop:1,paddingBottom:1,children:(0,n.jsx)(X,{variant:"pi",textColor:"neutral800",fontWeight:t?"bold":"normal","aria-current":t,...s,children:e})});Sn.displayName="Crumb";var Be=a(91566),no=a(4702),so=a(16034);const Lt="success-light",Nt="danger-light",bt="default",ot="tertiary",rt="secondary",Fn="danger",Ln="success",It="ghost",Rt=[Lt,Nt],ao=[bt,ot,rt,Fn,Ln,It,...Rt],oo=["S","M","L"],Te=e=>e===Lt||e===Nt?`${e.substring(0,e.lastIndexOf("-"))}`:e===ot?"neutral":e===bt||e===rt||ao.every(t=>t!==e)?"primary":`${e}`,Nn=({theme:e})=>`
    border: 1px solid ${e.colors.neutral200};
    background: ${e.colors.neutral150};
    ${X} {
      color: ${e.colors.neutral600};
    }
    svg {
      > g, path {
        fill: ${e.colors.neutral600};
      }
    }
  `,ro=({theme:e,variant:t})=>[...Rt,rt].includes(t)?`
      background-color: ${e.colors.neutral0};
    `:t===ot?`
      background-color: ${e.colors.neutral100};
    `:t===It?`
      background-color: ${e.colors.neutral100};
    `:t===bt?`
      border: 1px solid ${e.colors.buttonPrimary500};
      background: ${e.colors.buttonPrimary500};
    `:`
    border: 1px solid ${e.colors[`${Te(t)}500`]};
    background: ${e.colors[`${Te(t)}500`]};
  `,io=({theme:e,variant:t})=>[...Rt,rt].includes(t)?`
      background-color: ${e.colors.neutral0};
      border: 1px solid ${e.colors[`${Te(t)}600`]};
      ${X} {
        color: ${e.colors[`${Te(t)}600`]};
      }
      svg {
        > g, path {
          fill: ${e.colors[`${Te(t)}600`]};
        }
      }
    `:t===ot?`
      background-color: ${e.colors.neutral150};
    `:`
    border: 1px solid ${e.colors[`${Te(t)}600`]};
    background: ${e.colors[`${Te(t)}600`]};
  `,lo=({theme:e,variant:t})=>{switch(t){case Nt:case Lt:case rt:return`
          border: 1px solid ${e.colors[`${Te(t)}200`]};
          background: ${e.colors[`${Te(t)}100`]};
          ${X} {
            color: ${e.colors[`${Te(t)}700`]};
          }
          svg {
            > g, path {
              fill: ${e.colors[`${Te(t)}700`]};
            }
          }
        `;case ot:return`
          border: 1px solid ${e.colors.neutral200};
          background: ${e.colors.neutral0};
          ${X} {
            color: ${e.colors.neutral800};
          }
          svg {
            > g, path {
              fill: ${e.colors.neutral800};
            }
          }
        `;case It:return`
        border: 1px solid transparent;
        background: transparent;

        ${X} {
          color: ${e.colors.neutral800};
        }

        svg {
          > g, path {
            fill: ${e.colors.neutral500};
          }
        }
      `;case Ln:case Fn:return`
          border: 1px solid ${e.colors[`${Te(t)}600`]};
          background: ${e.colors[`${Te(t)}600`]};
          ${X} {
            color: ${e.colors.neutral0};
          }
        `;default:return`
          svg {
            > g, path {
              fill: ${e.colors.buttonNeutral0};
            }
          }
        `}},co=(0,w.i7)`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
`,uo=(0,w.Ay)(so.A)`
  animation: ${co} 2s infinite linear;
  will-change: transform;
`,mo=(0,w.Ay)($t)`
  height: ${({theme:e,size:t})=>e.sizes.button[t]};

  svg {
    height: ${12/16}rem;
    width: auto;
  }

  &[aria-disabled='true'] {
    ${Nn}

    &:active {
      ${Nn}
    }
  }

  &:hover {
    ${ro}
  }

  &:active {
    ${io}
  }

  ${lo}
`,In=u.forwardRef(({variant:e=bt,startIcon:t,endIcon:s,disabled:r=!1,children:o,onClick:l,size:i=oo[0],loading:d=!1,fullWidth:g=!1,...m},f)=>{const p=r||d,T=C=>{!p&&l&&l(C)};return(0,n.jsxs)(mo,{ref:f,"aria-disabled":p,disabled:p,size:i,variant:e,onClick:T,fullWidth:g,alignItems:"center",background:"buttonPrimary600",borderColor:"buttonPrimary600",gap:2,inline:g,justifyContent:g?"center":void 0,paddingLeft:4,paddingRight:4,width:g?"100%":void 0,...m,children:[(t||d)&&(0,n.jsx)(K,{"aria-hidden":!0,children:d?(0,n.jsx)(uo,{}):t}),(0,n.jsx)(X,{variant:i==="S"?"pi":void 0,fontWeight:"bold",textColor:"buttonNeutral0",children:o}),s&&(0,n.jsx)(ce,{"aria-hidden":!0,children:s})]})});In.displayName="Button";const po=Be.bL,go=(0,u.forwardRef)(({size:e,endIcon:t=(0,n.jsx)(St.A,{width:`${6/16}rem`,height:`${4/16}rem`,"aria-hidden":!0}),...s},r)=>(0,n.jsx)(Be.l9,{asChild:!0,children:(0,n.jsx)(In,{ref:r,type:"button",variant:"ghost",endIcon:t,paddingTop:e==="S"?1:2,paddingBottom:e==="S"?1:2,paddingLeft:e==="S"?3:4,paddingRight:e==="S"?3:4,...s})})),fo=(0,u.forwardRef)(({children:e,intersectionId:t,popoverPlacement:s="bottom-start",...r},o)=>{const[l,i]=s.split("-");return(0,n.jsx)(Be.ZL,{children:(0,n.jsx)(Be.UC,{align:i,side:l,loop:!0,asChild:!0,children:(0,n.jsxs)(Rn,{ref:o,direction:"column",borderStyle:"solid",borderWidth:"1px",borderColor:"neutral150",hasRadius:!0,background:"neutral0",shadow:"filterShadow",maxHeight:"15rem",padding:1,alignItems:"flex-start",position:"relative",overflow:"auto",...r,children:[e,(0,n.jsx)(K,{id:t,width:"100%",height:"1px"})]})})})}),Rn=(0,w.Ay)(ce)`
  scrollbar-width: none;
  -ms-overflow-style: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`,ho=({onSelect:e,disabled:t=!1,...s})=>(0,n.jsx)(Be.q7,{asChild:!0,onSelect:e,disabled:t,children:s.isLink||s.isExternal?(0,n.jsx)(yo,{color:"neutral800",...s,isExternal:s.isExternal??!1,children:(0,n.jsx)(X,{children:s.children})}):(0,n.jsx)(wn,{cursor:"pointer",color:"neutral800",background:"transparent",borderStyle:"none",...s,children:(0,n.jsx)(X,{children:s.children})})}),En=({theme:e})=>(0,w.AH)`
  text-align: left;
  width: 100%;
  border-radius: ${e.borderRadius};
  padding: ${e.spaces[2]} ${e.spaces[4]};

  ${X} {
    color: inherit;
  }

  &[aria-disabled] {
    cursor: not-allowed;

    ${X} {
      color: ${e.colors.neutral500};
    }
  }

  &[data-highlighted] {
    background-color: ${e.colors.primary100};
  }

  &:focus-visible {
    outline: none;

    &:after {
      content: none;
    }
  }
`,wn=(0,w.Ay)(ce)`
  ${En}
`,yo=(0,w.Ay)(xt)`
  /* We include this here again because typically when people use OptionLink they provide an as prop which cancels the Box props */
  color: ${({theme:e,color:t})=>ie(e.colors,t,void 0)};
  text-decoration: none;

  &:hover {
    color: unset;
  }

  svg > path,
  &:focus-visible svg > path {
    fill: currentColor;
  }

  ${En}
`,Qd=(0,u.forwardRef)((e,t)=>(0,n.jsx)(Be.JU,{asChild:!0,children:(0,n.jsx)(xo,{ref:t,variant:"sigma",textColor:"neutral600",...e})})),xo=(0,w.Ay)(X)`
  padding: ${({theme:e})=>e.spaces[2]} ${({theme:e})=>e.spaces[4]};
`,Xd=Be.Pb,Jd=(0,u.forwardRef)(({disabled:e=!1,...t},s)=>(0,n.jsx)(Be.ZP,{asChild:!0,disabled:e,children:(0,n.jsxs)(bo,{ref:s,color:"neutral800",as:"button",type:"button",background:"transparent",borderStyle:"none",gap:5,...t,children:[(0,n.jsx)(X,{children:t.children}),(0,n.jsx)(vo,{height:12,width:12})]})})),bo=(0,w.Ay)(wn)`
  &[data-state='open'] {
    background-color: ${({theme:e})=>e.colors.primary100};
  }
`,vo=(0,w.Ay)(no.A)`
  path {
    fill: ${({theme:e})=>e.colors.neutral500};
  }
`,qd=(0,u.forwardRef)((e,t)=>(0,n.jsx)(Be.ZL,{children:(0,n.jsx)(Be.G5,{sideOffset:8,asChild:!0,children:(0,n.jsx)(Rn,{ref:t,direction:"column",borderStyle:"solid",borderWidth:"1px",borderColor:"neutral150",hasRadius:!0,background:"neutral0",shadow:"filterShadow",maxHeight:"15rem",padding:1,alignItems:"flex-start",overflow:"auto",...e})})})),Ao=po,Co=go,jo=fo,To=ho,_d=null,ec=null,tc=null,nc=null;var Mo=a(75516),$o=a(66159),So=a(28763),Fo=a(52230),Dn=a(95065),Lo=a(59148),No=a(83461),Io=a(94744),Ro=a(59004),Eo=a(13318),wo=a(18904),Do=a(95289),Oo=a(38697),Bo=a(15691),Po=a(83609),ko=a(40339),Wo=a(44030),zo=a(40463),Uo=a(59385),Vo=a(24685),Zo=a(13333),Ho=a(69999),Go=a(77938),Yo=a(66804),Ko=a(28816),Qo=a(88938),Xo=a(10034),Jo=a(73568),qo=a(58241),_o=a(90808),er=a(24304),tr=a(91325),nr=a(44169),sr=a(47213),ar=a(2664),or=a(97219),rr=a(34610),ir=a(56349),lr=a(69840),dr=a(14027),cr=a(2570),ur=a(21291),mr=a(4043),pr=a(8046),gr=a(29468),fr=a(58037),hr=a(90817),yr=a(80141),xr=a(94013),br=a(61983),vr=a(32598),Ar=a(36005),Cr=a(88706),jr=a(51303),Tr=a(99136),Mr=a(97937),$r=a(4219),Sr=a(79265),Fr=a(29325),Lr=a(70983),Nr=a(61271),Ir=a(19404),Rr=a(98266),Er=a(50350),wr=a(36625),Dr=a(41564),Or=a(423),Br=a(95350),Pr=a(43400),On=a(27060),Bn=a(83551),Pn=a(25394),kr=a(32782),Wr=a(50660),zr=a(6299),Ur=a(79195),Vr=a(15196),Zr=a(94624),kn=a(19143),Wn=a(72734),zn=a(37218),Hr=a(46905),Gr=a(54063),Yr=a(87863),Kr=a(31708),Qr=a(12233),Xr=a(73283),Jr=a(26140),qr=a(26190),_r=a(7187),ei=a(47449),He=a(31127),ti=a(41670),ni=a(40547),si=a(55087),ai=a(71597),oi=a(25942),ri=a(68110),ii=a(84395),li=a(99074),di=a(47658),ci=a(22019),ui=a(58314),mi=a(83620),pi=a(31317),gi=a(3669),fi=a(86173),hi=a(47605),yi=a(35127),xi=a(71222),bi=a(17304),vi=a(59267),Ai=a(88719),Ci=a(61857),ji=a(33950),Ti=a(17971),Mi=a(70552),$i=a(41686),Si=a(60261),Fi=a(7138),Li=a(32310),Ni=a(7954),Ii=a(69816),Ri=a(82083),Ei=a(50336),it=a(80868);const wi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 34 25",...e,children:[(0,n.jsx)("rect",{width:33,height:23,x:.5,y:1,fill:"#EAF5FF",stroke:"#B8E1FF",rx:2.5}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M18.901 9.828a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M19.703 8.785a.81.81 0 0 1-.512.748.814.814 0 0 1-.91-.239.804.804 0 0 1 .753-1.301.814.814 0 0 1 .669.792c.005.311.487.311.483 0a1.308 1.308 0 0 0-.867-1.215 1.288 1.288 0 0 0-1.4.39 1.296 1.296 0 0 0-.119 1.489c.283.468.83.697 1.364.596.597-.113 1.012-.664 1.021-1.258.005-.314-.477-.314-.482-.002ZM18.901 13.488a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M19.703 12.445a.81.81 0 0 1-.512.748.814.814 0 0 1-.91-.239.804.804 0 0 1 .753-1.301.812.812 0 0 1 .669.792c.005.311.487.311.483 0a1.307 1.307 0 0 0-.867-1.215 1.288 1.288 0 0 0-1.4.39 1.296 1.296 0 0 0-.119 1.489c.283.468.83.697 1.364.596.597-.113 1.012-.664 1.021-1.258.005-.314-.477-.314-.482-.002ZM18.901 17.247a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M19.703 16.204a.81.81 0 0 1-.512.748.814.814 0 0 1-.91-.239.804.804 0 0 1 .753-1.301.812.812 0 0 1 .669.792c.005.311.487.311.483 0a1.308 1.308 0 0 0-.867-1.215 1.288 1.288 0 0 0-1.4.39 1.296 1.296 0 0 0-.119 1.489c.283.468.83.698 1.364.596.597-.113 1.012-.664 1.021-1.258.005-.313-.477-.313-.482-.002ZM15.075 9.842a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M15.876 8.8a.81.81 0 0 1-.512.748.814.814 0 0 1-.91-.24.804.804 0 0 1 .753-1.301.81.81 0 0 1 .669.792c.005.312.488.312.483 0a1.308 1.308 0 0 0-.867-1.214 1.288 1.288 0 0 0-1.4.389 1.296 1.296 0 0 0-.119 1.49c.283.468.831.697 1.365.596.596-.114 1.011-.664 1.02-1.258.006-.314-.477-.314-.482-.003ZM15.075 13.503a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M15.876 12.46a.81.81 0 0 1-.512.748.814.814 0 0 1-.91-.24.804.804 0 0 1 .753-1.301.81.81 0 0 1 .669.792c.005.312.488.312.483 0a1.308 1.308 0 0 0-.867-1.214 1.288 1.288 0 0 0-1.4.389 1.296 1.296 0 0 0-.119 1.49c.283.468.831.697 1.365.596.596-.114 1.011-.664 1.02-1.258.006-.314-.477-.314-.482-.003ZM15.075 17.261a1.043 1.043 0 1 0 0-2.086 1.043 1.043 0 0 0 0 2.086Z"}),(0,n.jsx)("path",{fill:"#0C75AF",d:"M15.876 16.218a.81.81 0 0 1-.512.749.814.814 0 0 1-.91-.24.804.804 0 0 1 .753-1.301.808.808 0 0 1 .669.792c.005.312.488.312.483 0a1.308 1.308 0 0 0-.867-1.214 1.288 1.288 0 0 0-1.4.389 1.293 1.293 0 0 0-.119 1.487c.283.468.831.698 1.365.596.596-.113 1.011-.664 1.02-1.258.006-.311-.477-.311-.482 0Z"})]}),Di=wi;var Oi=a(45673);const Bi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 32 24",...e,children:[(0,n.jsx)("rect",{width:31,height:23,x:.5,y:.5,fill:"#4945FF",stroke:"#4945FF",rx:2.5}),(0,n.jsx)("path",{fill:"#fff",d:"M15.328 10.54h1.723c.012-.089.012-.165.012-.253 0-1.676-1.471-2.959-3.41-2.959-2.696 0-4.647 2.22-4.647 5.344 0 2.15 1.383 3.545 3.504 3.545 2.045 0 3.597-1.154 3.967-2.936h-1.752c-.276.826-1.102 1.371-2.063 1.371-1.137 0-1.846-.802-1.846-2.103 0-2.08 1.19-3.65 2.725-3.65 1.037 0 1.746.62 1.787 1.558v.082ZM21.053 16l1.488-6.943h2.531l.31-1.512H18.54l-.31 1.512h2.53L19.272 16h1.782Z"})]}),Un=Bi;var Pi=a(86040),vt=a(43023),ki=a(67152),Wi=a(48313),Vn=a(35800),Et=a(26085),Zn=a(3177);const zi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 32 24",...e,children:[(0,n.jsx)("path",{fill:"#FDF4DC",stroke:"#FAE7B9",d:"M.5 3A2.5 2.5 0 0 1 3 .5h26A2.5 2.5 0 0 1 31.5 3v18a2.5 2.5 0 0 1-2.5 2.5H3A2.5 2.5 0 0 1 .5 21V3Z"}),(0,n.jsx)("path",{fill:"#D9822F",d:"M20.158 11.995c0-.591-.463-1.073-1.045-1.11H13.53V9.245a2.05 2.05 0 0 1 2.046-2.049c1.13 0 2.048.784 2.049 1.913 0 .24.194.433.433.433h.33a.433.433 0 0 0 .433-.433C18.82 7.32 17.365 5.999 15.577 6a3.246 3.246 0 0 0-3.241 3.244v1.642h-.223c-.615 0-1.113.499-1.113 1.114v4.887c.001.615.5 1.113 1.115 1.113l6.93-.003c.616 0 1.114-.5 1.114-1.115l-.001-4.887Z"})]}),Ui=zi;var Vi=a(39915);const Zi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 32 24",...e,children:[(0,n.jsx)("rect",{width:31,height:23,x:.5,y:.5,fill:"#EAF5FF",stroke:"#B8E1FF",rx:2.5}),(0,n.jsx)("path",{fill:"#0C75AF",fillRule:"evenodd",d:"M19.286 9.286v-.857a.397.397 0 0 0-.138-.302A.465.465 0 0 0 18.82 8h-8.357a.465.465 0 0 0-.326.127.397.397 0 0 0-.138.302v.857c0 .116.046.216.138.301.092.085.2.127.326.127h8.357a.465.465 0 0 0 .327-.127.397.397 0 0 0 .138-.301Zm2.785 2.713v.857a.397.397 0 0 1-.137.301.465.465 0 0 1-.327.128H10.464a.465.465 0 0 1-.326-.128.397.397 0 0 1-.138-.301v-.857c0-.116.046-.217.138-.302a.465.465 0 0 1 .326-.127h11.143c.126 0 .235.043.327.127a.397.397 0 0 1 .137.302Zm-1.857 3.574v.857a.397.397 0 0 1-.137.302.465.465 0 0 1-.327.127h-9.286a.465.465 0 0 1-.326-.127.397.397 0 0 1-.138-.302v-.857c0-.116.046-.216.138-.301a.465.465 0 0 1 .326-.127h9.286c.126 0 .235.042.326.127a.397.397 0 0 1 .138.301Z",clipRule:"evenodd"})]}),Hi=Zi,Gi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 32 24",...e,children:[(0,n.jsx)("rect",{width:31,height:23,x:.5,y:.5,fill:"#0C75AF",stroke:"#0C75AF",rx:2.5}),(0,n.jsx)("path",{fill:"#fff",d:"M8.523 13.586c.106 1.64 1.418 2.63 3.34 2.63 2.098 0 3.516-1.113 3.516-2.788 0-1.143-.65-1.846-2.086-2.297l-.867-.27c-.797-.252-1.137-.597-1.137-1.066 0-.598.633-1.031 1.459-1.031.873 0 1.512.474 1.617 1.183h1.67c-.053-1.54-1.36-2.619-3.217-2.619-1.91 0-3.328 1.131-3.328 2.678 0 1.09.715 1.922 1.963 2.309l.879.275c.914.287 1.266.592 1.266 1.084 0 .662-.657 1.107-1.606 1.107-.914 0-1.635-.469-1.758-1.195h-1.71ZM20.107 16l1.489-6.943h2.531l.31-1.512h-6.843l-.31 1.512h2.53L18.326 16h1.781Z"})]}),Yi=Gi;var Hn=a(65414),Ki=a(78519);const Qi=e=>(0,n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"1rem",height:"1rem",fill:"none",viewBox:"0 0 24 24",...e,children:[(0,n.jsx)("path",{fill:"#181826",d:"m10.614 17.796.878-2.01a7.742 7.742 0 0 1 3.94-3.992l2.416-1.072c.768-.341.768-1.458 0-1.8l-2.34-1.038a7.747 7.747 0 0 1-3.997-4.125l-.89-2.142a.946.946 0 0 0-1.758 0l-.889 2.142a7.747 7.747 0 0 1-3.997 4.125l-2.34 1.039c-.768.34-.768 1.458 0 1.799l2.415 1.072a7.742 7.742 0 0 1 3.94 3.991l.878 2.01a.946.946 0 0 0 1.744 0Zm8.787 4.894.247-.566a4.365 4.365 0 0 1 2.221-2.25l.76-.339a.53.53 0 0 0 0-.963l-.717-.319a4.368 4.368 0 0 1-2.253-2.326l-.254-.611a.507.507 0 0 0-.942 0l-.254.61a4.368 4.368 0 0 1-2.253 2.327l-.718.32a.53.53 0 0 0 0 .962l.76.338a4.365 4.365 0 0 1 2.222 2.251l.247.566c.18.414.754.414.934 0Z"}),(0,n.jsx)("path",{fill:"#181826",d:"m10.614 17.796.878-2.01a7.742 7.742 0 0 1 3.94-3.992l2.416-1.072c.768-.341.768-1.458 0-1.8l-2.34-1.038a7.747 7.747 0 0 1-3.997-4.125l-.89-2.142a.946.946 0 0 0-1.758 0l-.889 2.142a7.747 7.747 0 0 1-3.997 4.125l-2.34 1.039c-.768.34-.768 1.458 0 1.799l2.415 1.072a7.742 7.742 0 0 1 3.94 3.991l.878 2.01a.946.946 0 0 0 1.744 0Zm8.787 4.894.247-.566a4.365 4.365 0 0 1 2.221-2.25l.76-.339a.53.53 0 0 0 0-.963l-.717-.319a4.368 4.368 0 0 1-2.253-2.326l-.254-.611a.507.507 0 0 0-.942 0l-.254.61a4.368 4.368 0 0 1-2.253 2.327l-.718.32a.53.53 0 0 0 0 .962l.76.338a4.365 4.365 0 0 1 2.222 2.251l.247.566c.18.414.754.414.934 0Z"})]}),Xi=Qi;var Ji=a(28312),qi=a(39423),We=a(39404),A=a(24648),wt=a(56336),D=a(2600),_i=a(94710),Gn=a(48940),el=a(14311),Xe=a(82437),tl=a(412),Yn=a(89102),nl=a(5409),Dt=a(21835),Kn=a(35336),sl=a(71547),j=a(12083),al=a(17024),Ot=a(71210),Qn=a(70653),ol=a(5790),Xn=a(35223),rl=a(45635);const c=e=>`${A.p}.${e}`,Jn=(0,u.createContext)(),ze=()=>(0,u.useContext)(Jn),qn=u.createContext(),Je=()=>(0,u.useContext)(qn),il=()=>{const{components:e,componentsGroupedByCategory:t,contentTypes:s,isInDevelopmentMode:r,sortedContentTypesList:o,modifiedData:l,initialData:i}=ze(),d=(0,F.hN)(),{trackUsage:g}=(0,F.z1)(),[m,f]=(0,u.useState)(""),{onOpenModalCreateSchema:p,onOpenModalEditCategory:T}=Je(),{locale:C}=(0,Y.A)(),{startsWith:b}=(0,F.U2)(C,{sensitivity:"base"}),M=(0,F.QM)(C,{sensitivity:"base"}),U=!Object.keys(s).some(V=>s[V].isTemporary===!0)&&!Object.keys(e).some(V=>e[V].isTemporary===!0)&&wt(l,i),$=()=>{U?(g("willCreateContentType"),p({modalType:"contentType",kind:"collectionType",actionType:"create",forTarget:"contentType"})):k()},L=()=>{U?(g("willCreateSingleType"),p({modalType:"contentType",kind:"singleType",actionType:"create",forTarget:"contentType"})):k()},N=()=>{U?(g("willCreateComponent"),p({modalType:"component",kind:null,actionType:"create",forTarget:"component"})):k()},k=()=>{d({type:"info",message:{id:c("notification.info.creating.notSaved"),defaultMessage:"Please save your work before creating a new collection type or component"}})},_=Object.entries(t).map(([V,Ce])=>({name:V,title:V,isEditable:r,onClickEdit(ee,$e){ee.stopPropagation(),U?T($e.name):k()},links:Ce.map(ee=>({name:ee.uid,to:`/plugins/${A.p}/component-categories/${V}/${ee.uid}`,title:ee.schema.displayName})).sort((ee,$e)=>M.compare(ee.title,$e.title))})).sort((V,Ce)=>M.compare(V.title,Ce.title)),he=o.filter(V=>V.visible);return{menu:[{name:"models",title:{id:`${c("menu.section.models.name")}`,defaultMessage:"Collection Types"},customLink:r&&{id:`${c("button.model.create")}`,defaultMessage:"Create new collection type",onClick:$},links:he.filter(V=>V.kind==="collectionType")},{name:"singleTypes",title:{id:`${c("menu.section.single-types.name")}`,defaultMessage:"Single Types"},customLink:r&&{id:`${c("button.single-types.create")}`,defaultMessage:"Create new single type",onClick:L},links:he.filter(V=>V.kind==="singleType")},{name:"components",title:{id:`${c("menu.section.components.name")}`,defaultMessage:"Components"},customLink:r&&{id:`${c("button.component.create")}`,defaultMessage:"Create a new component",onClick:N},links:_}].map(V=>V.links.some(ee=>Array.isArray(ee.links))?{...V,links:V.links.map(ee=>{const $e=ee.links.filter(pe=>b(pe.title,m));return $e.length===0?null:{...ee,links:$e.sort((pe,le)=>M.compare(pe.title,le.title))}}).filter(Boolean)}:{...V,links:V.links.filter(ee=>b(ee.title,m)).sort((ee,$e)=>M.compare(ee.title,$e.title))}),searchValue:m,onSearchChange:f}},ll=()=>{const{menu:e,searchValue:t,onSearchChange:s}=il(),{formatMessage:r}=(0,Y.A)();return(0,n.jsxs)(Ks,{ariaLabel:r({id:`${c("plugin.name")}`,defaultMessage:"Content-Types Builder"}),children:[(0,n.jsx)(Pa,{searchable:!0,value:t,onClear:()=>s(""),onChange:o=>s(o.target.value),label:r({id:`${c("plugin.name")}`,defaultMessage:"Content-Types Builder"}),searchLabel:r({id:"global.search",defaultMessage:"Search"})}),(0,n.jsx)(ka,{children:e.map(o=>(0,n.jsxs)(u.Fragment,{children:[(0,n.jsx)(Ha,{label:r({id:o.title.id,defaultMessage:o.title.defaultMessage}),collapsable:!0,badgeLabel:o.links.length.toString(),children:o.links.map(l=>l.links?(0,n.jsx)(Qa,{label:We(l.title),children:l.links.map(i=>(0,n.jsx)(Tn,{as:an.k2,to:i.to,active:i.active,isSubSectionChild:!0,children:We(r({id:i.name,defaultMessage:i.title}))},i.name))},l.name):(0,n.jsx)(Tn,{as:an.k2,to:l.to,active:l.active,children:We(r({id:l.name,defaultMessage:l.title}))},l.name))}),o.customLink&&(0,n.jsx)(h.a,{paddingLeft:7,children:(0,n.jsx)(P.Q,{onClick:o.customLink.onClick,startIcon:(0,n.jsx)(O.I,{as:He.A,width:(0,F.a8)(8),height:(0,F.a8)(8)}),marginTop:2,children:r({id:o.customLink.id,defaultMessage:o.customLink.defaultMessage})})})]},o.name))})]})},_n=e=>e.kind==="collectionType"&&(e.restrictRelationsTo===null||Array.isArray(e.restrictRelationsTo)&&e.restrictRelationsTo.length>0),Bt=(e,t)=>e.find(({name:s})=>s===t),dl=[{label:"All",children:[{label:"images (JPEG, PNG, GIF, SVG, TIFF, ICO, DVU)",value:"images"},{label:"videos (MPEG, MP4, Quicktime, WMV, AVI, FLV)",value:"videos"},{label:"audios (MP3, WAV, OGG)",value:"audios"},{label:"files (CSV, ZIP, PDF, Excel, JSON, ...)",value:"files"}]}],cl=({intlLabel:e,name:t,onChange:s,value:r=null})=>{const{formatMessage:o}=(0,Y.A)(),l=r===null||r?.length===0?o({id:"global.none",defaultMessage:"None"}):[...r].sort().map(d=>We(d)).join(", "),i=e.id?o({id:e.id,defaultMessage:e.defaultMessage}):t;return(0,n.jsx)(B.B,{id:"select1",label:i,customizeContent:()=>l,onChange:d=>{d.length>0?s({target:{name:t,value:d,type:"allowed-types-select"}}):s({target:{name:t,value:null,type:"allowed-types-select"}})},options:dl,value:r||[]})},es={biginteger:it.A,blocks:Di,boolean:Oi.A,collectionType:Un,component:Pi.A,contentType:Un,date:vt.A,datetime:vt.A,decimal:it.A,dynamiczone:ki.A,email:Wi.A,enum:Vn.A,enumeration:Vn.A,file:Et.A,files:Et.A,float:it.A,integer:it.A,json:Zn.A,JSON:Zn.A,media:Et.A,number:it.A,password:Ui,relation:Vi.A,richtext:Hi,singleType:Yi,string:Hn.A,text:Hn.A,time:vt.A,timestamp:vt.A,uid:Ki.A},ul=(0,w.Ay)(h.a)`
  svg {
    height: 100%;
    width: 100%;
  }
`,lt=({type:e,customField:t=null,...s})=>{const r=(0,F.AC)();let o=es[e];if(t){const i=r.get(t)?.icon;i&&(o=i)}return es[e]?(0,n.jsx)(ul,{height:(0,F.a8)(24),width:(0,F.a8)(32),shrink:0,...s,"aria-hidden":!0,children:(0,n.jsx)(h.a,{as:o})}):null},ts=(0,w.Ay)(h.a)`
  width: 100%;
  height: 100%;
  border: 1px solid ${({theme:e})=>e.colors.neutral200};
  text-align: left;
  &:hover {
    background: ${({theme:e})=>e.colors.primary100};
    border: 1px solid ${({theme:e})=>e.colors.primary200};
  }
`,ml=["blocks"],pl=()=>(0,n.jsx)(v.s,{grow:1,justifyContent:"flex-end",children:(0,n.jsxs)(v.s,{gap:1,hasRadius:!0,background:"alternative100",padding:`${2/16}rem ${4/16}rem`,children:[(0,n.jsx)(O.I,{width:`${10/16}rem`,height:`${10/16}rem`,as:Xi,color:"alternative600"}),(0,n.jsx)(S.o,{textColor:"alternative600",variant:"sigma",children:"New"})]})}),gl=({type:e="text"})=>{const{formatMessage:t}=(0,Y.A)(),{onClickSelectField:s}=Je(),r=()=>{s({attributeType:e,step:e==="component"?"1":null})};return(0,n.jsx)(ts,{padding:4,as:"button",hasRadius:!0,type:"button",onClick:r,children:(0,n.jsxs)(v.s,{children:[(0,n.jsx)(lt,{type:e}),(0,n.jsxs)(h.a,{paddingLeft:4,width:"100%",children:[(0,n.jsxs)(v.s,{justifyContent:"space-between",children:[(0,n.jsx)(S.o,{fontWeight:"bold",children:t({id:c(`attribute.${e}`),defaultMessage:e})}),ml.includes(e)&&(0,n.jsx)(pl,{})]}),(0,n.jsx)(v.s,{children:(0,n.jsx)(S.o,{variant:"pi",textColor:"neutral600",children:t({id:c(`attribute.${e}.description`),defaultMessage:"A type for modeling data"})})})]})]})})},fl=({attributes:e})=>(0,n.jsx)(z.r,{tagName:"button",children:(0,n.jsx)(v.s,{direction:"column",alignItems:"stretch",gap:8,children:e.map((t,s)=>(0,n.jsx)(q.x,{gap:3,children:t.map(r=>(0,n.jsx)(te.E,{col:6,children:(0,n.jsx)(gl,{type:r})},r))},s))})}),hl=({customFieldUid:e,customField:t})=>{const{type:s,intlLabel:r,intlDescription:o}=t,{formatMessage:l}=(0,Y.A)(),{onClickSelectCustomField:i}=Je(),d=()=>{i({attributeType:s,customFieldUid:e})};return(0,n.jsx)(ts,{padding:4,as:"button",hasRadius:!0,type:"button",onClick:d,children:(0,n.jsxs)(v.s,{children:[(0,n.jsx)(lt,{type:s,customField:e}),(0,n.jsxs)(h.a,{paddingLeft:4,children:[(0,n.jsx)(v.s,{children:(0,n.jsx)(S.o,{fontWeight:"bold",children:l(r)})}),(0,n.jsx)(v.s,{children:(0,n.jsx)(S.o,{variant:"pi",textColor:"neutral600",children:l(o)})})]})]})})},yl=(0,w.Ay)(h.a)`
  background: ${({theme:e})=>`linear-gradient(180deg, rgba(234, 234, 239, 0) 0%, ${e.colors.neutral150} 100%)`};
  opacity: 0.33;
`,xl=()=>(0,n.jsx)(v.s,{wrap:"wrap",gap:4,children:[...Array(4)].map((e,t)=>(0,n.jsx)(yl,{height:"138px",width:"375px",hasRadius:!0},`empty-card-${t}`))}),bl=()=>{const{formatMessage:e}=(0,Y.A)();return(0,n.jsxs)(h.a,{position:"relative",children:[(0,n.jsx)(xl,{}),(0,n.jsx)(h.a,{position:"absolute",top:6,width:"100%",children:(0,n.jsxs)(v.s,{alignItems:"center",justifyContent:"center",direction:"column",children:[(0,n.jsx)(O.I,{as:Ji.A,color:"",width:"160px",height:"88px"}),(0,n.jsx)(h.a,{paddingTop:6,paddingBottom:4,children:(0,n.jsxs)(h.a,{textAlign:"center",children:[(0,n.jsx)(S.o,{variant:"delta",as:"p",textColor:"neutral600",children:e({id:c("modalForm.empty.heading"),defaultMessage:"Nothing in here yet."})}),(0,n.jsx)(h.a,{paddingTop:4,children:(0,n.jsx)(S.o,{variant:"delta",as:"p",textColor:"neutral600",children:e({id:c("modalForm.empty.sub-heading"),defaultMessage:"Find what you are looking for through a wide range of extensions."})})})]})}),(0,n.jsx)(oe.z,{to:`/marketplace?${nl.stringify({categories:["Custom fields"]})}`,variant:"secondary",startIcon:(0,n.jsx)(He.A,{}),children:e({id:c("modalForm.empty.button"),defaultMessage:"Add custom fields"})})]})})]})},vl=()=>{const{formatMessage:e}=(0,Y.A)(),t=(0,F.AC)(),s=Object.entries(t.getAll());if(!s.length)return(0,n.jsx)(bl,{});const r=s.sort((o,l)=>o[1].name>l[1].name?1:-1);return(0,n.jsx)(z.r,{tagName:"button",children:(0,n.jsxs)(v.s,{direction:"column",alignItems:"stretch",gap:3,children:[(0,n.jsx)(q.x,{gap:3,children:r.map(([o,l])=>(0,n.jsx)(te.E,{col:6,children:(0,n.jsx)(hl,{customFieldUid:o,customField:l},o)},o))}),(0,n.jsx)(xt,{href:"https://docs.strapi.io/developer-docs/latest/development/custom-fields.html",isExternal:!0,children:e({id:c("modalForm.tabs.custom.howToLink"),defaultMessage:"How to add custom fields"})})]})})},Al=({attributes:e,forTarget:t,kind:s})=>{const{formatMessage:r}=(0,Y.A)(),o=c("modalForm.tabs.default"),l=c("modalForm.tabs.custom"),i=t.includes("component")?"component":s,d=c(`modalForm.sub-header.chooseAttribute.${i}`);return(0,n.jsx)(ke.c,{padding:7,children:(0,n.jsxs)(me.f,{label:r({id:c("modalForm.tabs.label"),defaultMessage:"Default and Custom types tabs"}),id:"attribute-type-tabs",variant:"simple",children:[(0,n.jsxs)(v.s,{justifyContent:"space-between",children:[(0,n.jsx)(S.o,{variant:"beta",as:"h2",children:r({id:d,defaultMessage:"Select a field"})}),(0,n.jsxs)(de.t,{children:[(0,n.jsx)(de.o,{children:r({id:o,defaultMessage:"Default"})}),(0,n.jsx)(de.o,{children:r({id:l,defaultMessage:"Custom"})})]})]}),(0,n.jsx)(h.a,{paddingBottom:6,children:(0,n.jsx)(se.c,{})}),(0,n.jsxs)(re.T,{children:[(0,n.jsx)(re.K,{children:(0,n.jsx)(fl,{attributes:e})}),(0,n.jsx)(re.K,{children:(0,n.jsx)(vl,{})})]})]})})},Cl=({intlLabel:e,name:t,options:s,onChange:r,value:o=null})=>{const{formatMessage:l}=(0,Y.A)(),i=e.id?l({id:e.id,defaultMessage:e.defaultMessage},{...e.values}):t,d=g=>{let m="";g==="true"&&(m=!0),g==="false"&&(m=!1),r({target:{name:t,value:m,type:"select-default-boolean"}})};return(0,n.jsx)(ae.l,{label:i,id:t,name:t,onChange:d,value:(o===null?"":o).toString(),children:s.map(({metadatas:{intlLabel:g,disabled:m,hidden:f},key:p,value:T})=>(0,n.jsx)(Ie.c,{value:T,disabled:m,hidden:f,children:g.defaultMessage},p))})},jl=(0,w.Ay)(v.s)`
  position: relative;
  align-items: stretch;

  label {
    border-radius: 4px;
    max-width: 50%;
    cursor: pointer;
    user-select: none;
    flex: 1;
    ${(0,Re.id)()}
  }

  input {
    position: absolute;
    opacity: 0;
  }

  .option {
    height: 100%;
    border-radius: 4px;
    border: 1px solid ${({theme:e})=>e.colors.neutral200};
    will-change: transform, opacity;
    background: ${({theme:e})=>e.colors.neutral0};

    .checkmark {
      position: relative;
      display: block;
      will-change: transform;
      background: ${({theme:e})=>e.colors.neutral0};
      width: ${({theme:e})=>e.spaces[5]};
      height: ${({theme:e})=>e.spaces[5]};
      border: solid 1px ${({theme:e})=>e.colors.neutral300};
      border-radius: 50%;

      &:before,
      &:after {
        content: '';
        display: block;
        border-radius: 50%;
        width: ${({theme:e})=>e.spaces[3]};
        height: ${({theme:e})=>e.spaces[3]};
        position: absolute;
        top: 3px;
        left: 3px;
      }

      &:after {
        transform: scale(0);
        transition: inherit;
        will-change: transform;
      }
    }
  }

  .container input:checked ~ div {
    background: ${({theme:e})=>e.colors.primary100};
    ${S.o} {
      color: ${({theme:e})=>e.colors.primary600};
    }
    border: 1px solid ${({theme:e})=>e.colors.primary200};
    .checkmark {
      border: solid 1px ${({theme:e})=>e.colors.primary600};
      &::after {
        background: ${({theme:e})=>e.colors.primary600};
        transform: scale(1);
      }
    }
  }
`,Pt=({intlLabel:e,name:t,onChange:s,radios:r=[],value:o})=>{const{formatMessage:l}=(0,Y.A)();return(0,n.jsxs)(v.s,{direction:"column",alignItems:"stretch",gap:2,children:[(0,n.jsx)(S.o,{variant:"pi",fontWeight:"bold",textColor:"neutral800",htmlFor:t,as:"label",children:l(e)}),(0,n.jsx)(jl,{gap:4,alignItems:"stretch",children:r.map(i=>(0,n.jsxs)("label",{htmlFor:i.value.toString(),className:"container",children:[(0,n.jsx)("input",{id:i.value.toString(),name:t,className:"option-input",checked:i.value===o,value:i.value,onChange:s,type:"radio"},i.value),(0,n.jsx)(h.a,{className:"option",padding:4,children:(0,n.jsxs)(v.s,{children:[(0,n.jsx)(h.a,{paddingRight:4,children:(0,n.jsx)("span",{className:"checkmark"})}),(0,n.jsxs)(v.s,{direction:"column",alignItems:"stretch",gap:2,children:[(0,n.jsx)(S.o,{fontWeight:"bold",children:l(i.title)}),(0,n.jsx)(S.o,{variant:"pi",textColor:"neutral600",children:l(i.description)})]})]})})]},i.value))})]})},Tl=({onChange:e,name:t,intlLabel:s,...r})=>{const o=l=>{const i=l.target.value!=="false";e({target:{name:t,value:i,type:"boolean-radio-group"}})};return(0,n.jsx)(Pt,{...r,name:t,onChange:o,intlLabel:s})},Ml=({error:e,intlLabel:t,modifiedData:s,name:r,onChange:o,value:l=null})=>{const{formatMessage:i}=(0,Y.A)(),[d,g]=(0,u.useState)(!!l||l===0),m=t.id?i({id:t.id,defaultMessage:t.defaultMessage},{...t.values}):r,f=s.type==="biginteger"?"text":"number",p=!s.type,T=e?i({id:e,defaultMessage:e}):"";return(0,n.jsxs)(v.s,{direction:"column",alignItems:"stretch",gap:2,children:[(0,n.jsx)(xe.S,{id:r,name:r,onValueChange:C=>{o({target:{name:r,value:C?f==="text"?"0":0:null}}),g(U=>!U)},value:d,children:m}),d&&(0,n.jsx)(h.a,{paddingLeft:6,style:{maxWidth:"200px"},children:f==="text"?(0,n.jsx)(je.k,{label:"","aria-label":m,disabled:p,error:T,id:r,name:r,onChange:o,value:l===null?"":l}):(0,n.jsx)(gt.Q,{"aria-label":m,disabled:p,error:T,id:r,name:r,onValueChange:C=>{o({target:{name:r,value:C,type:f}})},value:l||0})})]})},$l=({onChange:e,...t})=>{const s=(0,F.hN)(),r=o=>{s({type:"info",message:{id:c("contentType.kind.change.warning"),defaultMessage:"You just changed the kind of a content type: API will be reset (routes, controllers, and services will be overwritten)."}}),e(o)};return(0,n.jsx)(Pt,{...t,onChange:r})},Sl=({description:e,disabled:t=!1,intlLabel:s,isCreating:r,name:o,onChange:l,value:i=!1})=>{const{formatMessage:d}=(0,Y.A)(),[g,m]=(0,u.useState)(!1),f=s.id?d({id:s.id,defaultMessage:s.defaultMessage},{...s.values}):o,p=e?d({id:e.id,defaultMessage:e.defaultMessage},{...e.values}):"",T=()=>m(M=>!M),C=()=>{l({target:{name:o,value:!1}}),T()},b=({target:{checked:M}})=>{if(!M&&!r){T();return}l({target:{name:o,value:M}})};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(xe.S,{checked:i,disabled:t,hint:p,name:o,onChange:b,children:f}),(0,n.jsx)(F.TM,{isOpen:g,onToggleDialog:T,onConfirm:C,bodyText:{id:c("popUpWarning.draft-publish.message"),defaultMessage:"If you disable the draft & publish, your drafts will be deleted."},leftButtonText:{id:"components.popUpWarning.button.cancel",defaultMessage:"No, cancel"},rightButtonText:{id:c("popUpWarning.draft-publish.button.confirm"),defaultMessage:"Yes, disable"}})]})},Fl=({categoryName:e,deleteCategory:t,deleteComponent:s,deleteContentType:r,isAttributeModal:o,isCustomFieldModal:l,isComponentAttribute:i,isComponentToDzModal:d,isContentTypeModal:g,isCreatingComponent:m,isCreatingComponentAttribute:f,isCreatingComponentInDz:p,isCreatingComponentWhileAddingAField:T,isCreatingContentType:C,isCreatingDz:b,isComponentModal:M,isDzAttribute:U,isEditingAttribute:$,isEditingCategory:L,isInFirstComponentStep:N,onSubmitAddComponentAttribute:k,onSubmitAddComponentToDz:_,onSubmitCreateContentType:he,onSubmitCreateComponent:Me,onSubmitCreateDz:V,onSubmitEditAttribute:Ce,onSubmitEditCategory:ee,onSubmitEditComponent:$e,onSubmitEditContentType:pe,onSubmitEditCustomFieldAttribute:le,onSubmitEditDz:Ue,onClickFinish:ye})=>{const{formatMessage:J}=(0,Y.A)();return d?p?(0,n.jsx)(ne.$,{variant:"secondary",type:"submit",onClick:I=>{I.preventDefault(),_(I,!0)},startIcon:(0,n.jsx)(He.A,{}),children:J({id:c("form.button.add-first-field-to-created-component"),defaultMessage:"Add first field to the component"})}):(0,n.jsx)(ne.$,{variant:"default",type:"submit",onClick:I=>{I.preventDefault(),_(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})}):o&&U&&!b?(0,n.jsx)(ne.$,{variant:"default",type:"submit",onClick:I=>{I.preventDefault(),ye(),Ue(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})}):o&&U&&b?(0,n.jsx)(n.Fragment,{children:(0,n.jsx)(ne.$,{variant:"secondary",type:"submit",onClick:I=>{I.preventDefault(),V(I,!0)},startIcon:(0,n.jsx)(He.A,{}),children:J({id:c("form.button.add-components-to-dynamiczone"),defaultMessage:"Add components to the zone"})})}):o&&i?N?(0,n.jsx)(ne.$,{variant:"secondary",type:"submit",onClick:I=>{I.preventDefault(),k(I,!0)},children:J(f?{id:c("form.button.configure-component"),defaultMessage:"Configure the component"}:{id:c("form.button.select-component"),defaultMessage:"Configure the component"})}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{variant:"secondary",type:"submit",onClick:I=>{I.preventDefault(),k(I,!0)},startIcon:(0,n.jsx)(He.A,{}),children:J(T?{id:c("form.button.add-first-field-to-created-component"),defaultMessage:"Add first field to the component"}:{id:c("form.button.add-field"),defaultMessage:"Add another field"})}),(0,n.jsx)(ne.$,{variant:"default",type:"button",onClick:I=>{I.preventDefault(),ye(),k(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})})]}):o&&!i&&!U?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{type:$?"button":"submit",variant:"secondary",onClick:I=>{I.preventDefault(),Ce(I,!0)},startIcon:(0,n.jsx)(He.A,{}),children:J({id:c("form.button.add-field"),defaultMessage:"Add another field"})}),(0,n.jsx)(ne.$,{type:$?"submit":"button",variant:"default",onClick:I=>{I.preventDefault(),ye(),Ce(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})})]}):g?(0,n.jsxs)(n.Fragment,{children:[!C&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{type:"button",variant:"danger",onClick:I=>{I.preventDefault(),r()},children:J({id:"global.delete",defaultMessage:"Delete"})}),(0,n.jsx)(ne.$,{type:"submit",variant:"default",onClick:I=>{I.preventDefault(),pe(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})})]}),C&&(0,n.jsx)(ne.$,{type:"submit",variant:"secondary",onClick:I=>{I.preventDefault(),he(I,!0)},children:J({id:"global.continue",defaultMessage:"Continue"})})]}):M?(0,n.jsxs)(n.Fragment,{children:[!m&&(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{type:"button",variant:"danger",onClick:I=>{I.preventDefault(),s()},children:J({id:"global.delete",defaultMessage:"Delete"})}),(0,n.jsx)(ne.$,{type:"submit",variant:"default",onClick:I=>{I.preventDefault(),$e(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})})]}),m&&(0,n.jsx)(ne.$,{type:"submit",variant:"secondary",onClick:I=>{I.preventDefault(),Me(I,!0)},children:J({id:"global.continue",defaultMessage:"Continue"})})]}):L?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{type:"button",variant:"danger",onClick:I=>{I.preventDefault(),e&&t(e)},children:J({id:"global.delete",defaultMessage:"Delete"})}),(0,n.jsx)(ne.$,{type:"submit",variant:"default",onClick:I=>{I.preventDefault(),ee(I)},children:J({id:"global.finish",defaultMessage:"finish"})})]}):l?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(ne.$,{type:$?"button":"submit",variant:"secondary",onClick:I=>{I.preventDefault(),le(I,!0)},startIcon:(0,n.jsx)(He.A,{}),children:J({id:c("form.button.add-field"),defaultMessage:"Add another field"})}),(0,n.jsx)(ne.$,{type:$?"submit":"button",variant:"default",onClick:I=>{I.preventDefault(),ye(),le(I,!1)},children:J({id:"global.finish",defaultMessage:"Finish"})})]}):null},Ll=({actionType:e=null,attributeName:t,attributeType:s,categoryName:r,contentTypeKind:o,dynamicZoneTarget:l,forTarget:i,modalType:d=null,targetUid:g,customFieldUid:m=null,showBackLink:f=!1})=>{const{formatMessage:p}=(0,Y.A)(),{modifiedData:T}=ze(),{onOpenModalAddField:C}=Je();let b="component",M=[];const U=T?.[i]?.[g]||T?.[i]||null,$=U?.schema.displayName;if(d==="contentType"&&(b=o),["component","editCategory"].includes(d||"")&&(b="component"),["component","contentType"].includes(d||"")){let N=c(`modalForm.component.header-${e}`);return d==="contentType"&&(N=c(`modalForm.${o}.header-create`)),e==="edit"&&(N=c("modalForm.header-edit")),(0,n.jsx)(st.r,{children:(0,n.jsxs)(v.s,{children:[(0,n.jsx)(h.a,{children:(0,n.jsx)(lt,{type:b})}),(0,n.jsx)(h.a,{paddingLeft:3,children:(0,n.jsx)(S.o,{fontWeight:"bold",textColor:"neutral800",as:"h2",id:"title",children:p({id:N},{name:$})})})]})})}return M=[{label:$,info:{category:U?.category||null,name:U?.schema.displayName}}],d==="chooseAttribute"&&(b=["component","components"].includes(i)?"component":U.schema.kind),d==="addComponentToDynamicZone"&&(b="dynamiczone",M.push({label:l})),(d==="attribute"||d==="customField")&&(b=s,M.push({label:t})),d==="editCategory"&&(M=[{label:p({id:c("modalForm.header.categories"),defaultMessage:"Categories"})},{label:r}]),(0,n.jsx)(st.r,{children:(0,n.jsxs)(v.s,{gap:3,children:[f&&(0,n.jsx)(xt,{"aria-label":p({id:c("modalForm.header.back"),defaultMessage:"Back"}),startIcon:(0,n.jsx)(Dn.A,{}),onClick:()=>C({forTarget:i,targetUid:g}),href:"#back",isExternal:!1}),(0,n.jsx)(lt,{type:b,customField:m}),(0,n.jsx)($n,{label:M.map(({label:N})=>N).join(","),children:M.map(({label:N,info:k},_,he)=>{if(N=We(N),!N)return null;const Me=`${N}.${_}`;return k?.category&&(N=`${N} (${We(k.category)} - ${We(k.name)})`),(0,n.jsx)(Sn,{isCurrent:_===he.length-1,children:N},Me)})})]})})},Nl=({modalType:e,forTarget:t,kind:s,actionType:r,step:o})=>{switch(e){case"chooseAttribute":return c(`modalForm.sub-header.chooseAttribute.${t?.includes("component")?"component":s||"collectionType"}`);case"attribute":return c(`modalForm.sub-header.attribute.${r}${o!=="null"&&o!==null&&r!=="edit"?".step":""}`);case"customField":return c(`modalForm.sub-header.attribute.${r}`);case"addComponentToDynamicZone":return c("modalForm.sub-header.addComponentToDynamicZone");default:return c("configurations")}},Il=({actionType:e,modalType:t,forTarget:s,kind:r,step:o,attributeType:l,attributeName:i,customField:d})=>{const{formatMessage:g}=(0,Y.A)(),m=t==="customField"?d?.intlLabel:{id:c(`attribute.${l}`)};return(0,n.jsxs)(v.s,{direction:"column",alignItems:"flex-start",paddingBottom:2,gap:1,children:[(0,n.jsx)(S.o,{as:"h2",variant:"beta",children:g({id:Nl({actionType:e,forTarget:s,kind:r,step:o,modalType:t}),defaultMessage:"Add new field"},{type:m?We(g(m)):"",name:We(i),step:o})}),(0,n.jsx)(S.o,{variant:"pi",textColor:"neutral600",children:g({id:c(`attribute.${l}.description`),defaultMessage:"A type for modeling data"})})]})},kt={alien:Mo.A,apps:$o.A,archive:So.A,arrowDown:Fo.A,arrowLeft:Dn.A,arrowRight:Lo.A,arrowUp:No.A,attachment:Io.A,bell:Ro.A,bold:Eo.A,book:wo.A,briefcase:Do.A,brush:Oo.A,bulletList:Bo.A,calendar:Po.A,car:ko.A,cast:Wo.A,chartBubble:zo.A,chartCircle:Uo.A,chartPie:Vo.A,check:Zo.A,clock:Ho.A,cloud:Go.A,code:Yo.A,cog:Ko.A,collapse:Qo.A,command:Xo.A,connector:Jo.A,crop:qo.A,crown:_o.A,cube:er.A,cup:tr.A,cursor:nr.A,dashboard:sr.A,database:ar.A,discuss:or.A,doctor:rr.A,earth:ir.A,emotionHappy:lr.A,emotionUnhappy:dr.A,envelop:cr.A,exit:ur.A,expand:mr.A,eye:pr.A,feather:gr.A,file:fr.A,fileError:hr.A,filePdf:yr.A,filter:xr.A,folder:br.A,gate:vr.A,gift:Ar.A,globe:Cr.A,grid:jr.A,handHeart:Tr.A,hashtag:Mr.A,headphone:$r.A,heart:Sr.A,house:Fr.A,information:Lr.A,italic:Nr.A,key:Ir.A,landscape:Rr.A,layer:Er.A,layout:wr.A,lightbulb:Dr.A,link:Or.A,lock:Br.A,magic:Pr.A,manyToMany:On.A,manyToOne:Bn.A,manyWays:Pn.A,medium:kr.A,message:Wr.A,microphone:zr.A,monitor:Ur.A,moon:Vr.A,music:Zr.A,oneToMany:kn.A,oneToOne:Wn.A,oneWay:zn.A,paint:Hr.A,paintBrush:Gr.A,paperPlane:Yr.A,pencil:Kr.A,phone:Qr.A,picture:Xr.A,pin:Jr.A,pinMap:qr.A,plane:_r.A,play:ei.A,plus:He.A,priceTag:ti.A,puzzle:ni.A,question:si.A,quote:ai.A,repeat:oi.A,restaurant:ri.A,rocket:ii.A,rotate:li.A,scissors:di.A,search:ht.A,seed:ci.A,server:ui.A,shield:mi.A,shirt:pi.A,shoppingCart:gi.A,slideshow:fi.A,stack:hi.A,star:yi.A,store:xi.A,strikeThrough:bi.A,sun:vi.A,television:Ai.A,thumbDown:Ci.A,thumbUp:ji.A,train:Ti.A,twitter:Mi.A,typhoon:$i.A,underline:Si.A,user:Fi.A,volumeMute:Li.A,volumeUp:Ni.A,walk:Ii.A,wheelchair:Ri.A,write:Ei.A},Rl=(0,w.Ay)(v.s)`
  label {
    ${(0,Re.id)()}
    border-radius: ${({theme:e})=>e.borderRadius};
    border: 1px solid ${({theme:e})=>e.colors.neutral100};
  }
`,El=({iconKey:e,name:t,onChange:s,isSelected:r,ariaLabel:o})=>(0,n.jsx)(ft.D,{name:t,required:!1,children:(0,n.jsxs)(Ns.d,{htmlFor:e,id:`${e}-label`,children:[(0,n.jsxs)(Is.s,{children:[(0,n.jsx)(Rs.T,{type:"radio",id:e,name:t,checked:r,onChange:s,value:e,"aria-checked":r,"aria-labelledby":`${e}-label`}),o]}),(0,n.jsx)(v.s,{padding:2,cursor:"pointer",hasRadius:!0,background:r?"primary200":void 0,children:(0,n.jsx)(O.I,{as:kt[e],color:r?"primary600":"neutral300"})})]})}),wl=({intlLabel:e,name:t,onChange:s,value:r=""})=>{const{formatMessage:o}=(0,Y.A)(),[l,i]=(0,u.useState)(!1),[d,g]=(0,u.useState)(""),m=Object.keys(kt),[f,p]=(0,u.useState)(m),T=(0,u.useRef)(null),C=(0,u.useRef)(null),b=()=>{i(!l)},M=({target:{value:L}})=>{g(L),p(()=>m.filter(N=>N.toLowerCase().includes(L.toLowerCase())))},U=()=>{b(),g(""),p(m)},$=()=>{s({target:{name:t,value:""}})};return(0,u.useEffect)(()=>{l&&C.current?.focus()},[l]),(0,n.jsxs)(n.Fragment,{children:[(0,n.jsxs)(v.s,{justifyContent:"space-between",paddingBottom:2,children:[(0,n.jsx)(S.o,{variant:"pi",fontWeight:"bold",textColor:"neutral800",as:"label",children:o(e)}),(0,n.jsxs)(v.s,{gap:1,children:[l?(0,n.jsx)(Es.S,{ref:C,name:"searchbar",size:"S",placeholder:o({id:c("ComponentIconPicker.search.placeholder"),defaultMessage:"Search for an icon"}),onBlur:()=>{d||b()},onChange:M,value:d,onClear:U,clearLabel:o({id:c("IconPicker.search.clear.label"),defaultMessage:"Clear the icon search"}),children:o({id:c("IconPicker.search.placeholder.label"),defaultMessage:"Search for an icon"})}):(0,n.jsx)(sn.K,{ref:T,onClick:b,"aria-label":o({id:c("IconPicker.search.button.label"),defaultMessage:"Search icon button"}),icon:(0,n.jsx)(ht.A,{}),noBorder:!0}),r&&(0,n.jsx)(ws.m,{description:o({id:c("IconPicker.remove.tooltip"),defaultMessage:"Remove the selected icon"}),children:(0,n.jsx)(sn.K,{onClick:$,"aria-label":o({id:c("IconPicker.remove.button"),defaultMessage:"Remove the selected icon button"}),icon:(0,n.jsx)(qi.A,{}),noBorder:!0})})]})]}),(0,n.jsx)(Rl,{position:"relative",padding:1,background:"neutral100",hasRadius:!0,wrap:"wrap",gap:2,maxHeight:"126px",overflow:"auto",textAlign:"center",children:f.length>0?f.map(L=>(0,n.jsx)(El,{iconKey:L,name:t,onChange:s,isSelected:L===r,ariaLabel:o({id:c("IconPicker.icon.label"),defaultMessage:"Select {icon} icon"},{icon:L})},L)):(0,n.jsx)(h.a,{padding:4,grow:2,children:(0,n.jsx)(S.o,{variant:"delta",textColor:"neutral600",textAlign:"center",children:o({id:c("IconPicker.emptyState.label"),defaultMessage:"No icon found"})})})})]})},Dl=({description:e,error:t,intlLabel:s,modifiedData:r,name:o,onChange:l,value:i})=>{const{formatMessage:d}=(0,Y.A)(),g=(0,u.useRef)(l),m=r?.displayName||"";(0,u.useEffect)(()=>{if(m){const C=(0,A.n)(m);try{const b=Dt(C,2);g.current({target:{name:o,value:b}})}catch{g.current({target:{name:o,value:C}})}}else g.current({target:{name:o,value:""}})},[m,o]);const f=t?d({id:t,defaultMessage:t}):"",p=e?d({id:e.id,defaultMessage:e.defaultMessage},{...e.values}):"",T=d(s);return(0,n.jsx)(je.k,{error:f,label:T,id:o,hint:p,name:o,onChange:l,value:i||""})},Ol=({oneThatIsCreatingARelationWithAnother:e,target:t})=>{const{contentTypes:s,sortedContentTypesList:r}=ze(),o=(0,Xe.wA)(),l=r.filter(_n),{plugin:i=null,schema:{displayName:d}={displayName:"error"}}=s?.[t]??{},g=({uid:m,plugin:f,title:p,restrictRelationsTo:T})=>()=>{const C=f?`${f}_${p}`:p;o({type:A.O,target:{value:m,oneThatIsCreatingARelationWithAnother:e,selectedContentTypeFriendlyName:C,targetContentTypeAllowedRelations:T}})};return(0,n.jsxs)(Ao,{children:[(0,n.jsx)(Bl,{children:`${d} ${i?`(from: ${i})`:""}`}),(0,n.jsx)(jo,{zIndex:5,children:l.map(({uid:m,title:f,restrictRelationsTo:p,plugin:T})=>(0,n.jsxs)(To,{onSelect:g({uid:m,plugin:T,title:f,restrictRelationsTo:p}),children:[f,"\xA0",T&&(0,n.jsxs)(n.Fragment,{children:["(from: ",T,")"]})]},m))})]})},Bl=(0,w.Ay)(Co)`
  svg {
    width: ${6/16}rem;
    height: ${4/16}rem;
  }
`,ns=({disabled:e=!1,error:t,header:s,isMain:r=!1,name:o,onChange:l,oneThatIsCreatingARelationWithAnother:i="",target:d="",value:g=""})=>(0,n.jsxs)(h.a,{background:"neutral100",hasRadius:!0,borderColor:"neutral200",children:[(0,n.jsx)(v.s,{paddingTop:r?4:1,paddingBottom:r?3:1,justifyContent:"center",children:r?(0,n.jsx)(S.o,{variant:"pi",fontWeight:"bold",textColor:"neutral800",children:s}):(0,n.jsx)(Ol,{target:d,oneThatIsCreatingARelationWithAnother:i})}),(0,n.jsx)(se.c,{background:"neutral200"}),(0,n.jsx)(h.a,{padding:4,children:(0,n.jsx)(F.ah,{disabled:e,error:t?.id||null,intlLabel:{id:c("form.attribute.item.defineRelation.fieldName"),defaultMessage:"Field name"},name:o,onChange:l,type:"text",value:g})})]}),Pl=(0,w.Ay)(h.a)`
  position: relative;
  width: 100%;
  &::before {
    content: '';
    position: absolute;
    top: calc(50% - 0px);
    height: 2px;
    width: 100%;
    background-color: ${({theme:e})=>e.colors.primary600};
    z-index: 0;
  }
`,kl=(0,w.Ay)(h.a)`
  background: ${({theme:e,isSelected:t})=>e.colors[t?"primary100":"neutral0"]};
  border: 1px solid
    ${({theme:e,isSelected:t})=>e.colors[t?"primary700":"neutral200"]};
  border-radius: ${({theme:e})=>e.borderRadius};
  z-index: 1;
  svg {
    width: 1.5rem;
    height: 100%;
    path {
      fill: ${({theme:e,isSelected:t})=>e.colors[t?"primary700":"neutral500"]};
    }
  }
  &:disabled {
    cursor: not-allowed;
  }
`,Wl=(0,w.Ay)(v.s)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`,zl={oneWay:zn.A,oneToOne:Wn.A,oneToMany:kn.A,manyToOne:Bn.A,manyToMany:On.A,manyWay:Pn.A},Ul=({naturePickerType:e,oneThatIsCreatingARelationWithAnother:t,relationType:s,target:r})=>{const o=(0,Xe.wA)(),{formatMessage:l}=(0,Y.A)(),{contentTypes:i,modifiedData:d}=ze(),g=["oneWay","oneToOne","oneToMany","manyToOne","manyToMany","manyWay"],m=["oneWay","manyWay"],p=(e==="contentType"?D(d,[e,"schema","kind"],""):e)==="collectionType"?g:m,T=s==="manyToOne",C=D(i,[r,"schema","displayName"],"unknown"),b=T?C:t,M=T?t:C,U=Dt(b,s==="manyToMany"?2:1),$=D(i,[r,"schema","restrictRelationsTo"],null),L=Dt(M,["manyToMany","oneToMany","manyToOne","manyWay"].includes(s)?2:1);return s?(0,n.jsxs)(v.s,{style:{flex:1},children:[(0,n.jsx)(Pl,{children:(0,n.jsx)(v.s,{paddingLeft:9,paddingRight:9,paddingTop:1,justifyContent:"center",children:(0,n.jsx)(z.r,{tagName:"button",children:(0,n.jsx)(v.s,{gap:3,children:p.map(N=>{const k=zl[N],_=$===null||$.includes(N);return(0,n.jsx)(kl,{as:"button",isSelected:s===N,disabled:!_,onClick:()=>{_&&o({type:A.a,target:{oneThatIsCreatingARelationWithAnother:t,targetContentType:r,value:N}})},padding:2,type:"button",children:(0,n.jsx)(k,{},N)},N)})})})})}),(0,n.jsxs)(Wl,{justifyContent:"center",children:[(0,n.jsxs)(S.o,{children:[Kn(U,{length:24}),"\xA0"]}),(0,n.jsxs)(S.o,{textColor:"primary600",children:[l({id:c(`relation.${s}`)}),"\xA0"]}),(0,n.jsx)(S.o,{children:Kn(L,{length:24})})]})]}):null},Vl=({formErrors:e,mainBoxHeader:t,modifiedData:s,naturePickerType:r,onChange:o})=>{const l=(0,A.g)(s.relation,s.targetAttribute);return(0,n.jsxs)(v.s,{style:{position:"relative"},children:[(0,n.jsx)(ns,{isMain:!0,header:t,error:e?.name||null,name:"name",onChange:o,value:s?.name||""}),(0,n.jsx)(Ul,{naturePickerType:r,oneThatIsCreatingARelationWithAnother:t,relationType:l,target:s.target}),(0,n.jsx)(ns,{disabled:["oneWay","manyWay"].includes(l),error:e?.targetAttribute||null,name:"targetAttribute",onChange:o,oneThatIsCreatingARelationWithAnother:t,target:s.target,value:s?.targetAttribute||""})]})},Zl=({error:e=null,intlLabel:t,name:s,onChange:r,value:o=void 0})=>{const{formatMessage:l}=(0,Y.A)(),{allComponentsCategories:i}=ze(),[d,g]=(0,u.useState)(i),m=e?l({id:e,defaultMessage:e}):"",f=l(t),p=C=>{r({target:{name:s,value:C,type:"select-category"}})},T=C=>{g(b=>[...b,C]),p(C)};return(0,n.jsx)(Ds.nP,{error:m,id:s,label:f,name:s,onChange:p,onCreateOption:T,value:o,children:d.map(C=>(0,n.jsx)(Os.j,{value:C,children:C},C))})},Hl=({error:e=null,intlLabel:t,isAddingAComponentToAnotherComponent:s,isCreating:r,isCreatingComponentWhileAddingAField:o,componentToCreate:l,name:i,onChange:d,targetUid:g,forTarget:m,value:f})=>{const{formatMessage:p}=(0,Y.A)(),T=e?p({id:e,defaultMessage:e}):"",C=p(t),{componentsGroupedByCategory:b,componentsThatHaveOtherComponentInTheirAttributes:M}=ze(),U=["component","components"].includes(m);let $=Object.entries(b).reduce((L,N)=>{const[k,_]=N,he=_.map(Me=>({uid:Me.uid,label:Me.schema.displayName,categoryName:k}));return[...L,...he]},[]);return s&&($=$.filter(L=>!M.includes(L.uid))),U&&($=$.filter(L=>L.uid!==g)),o&&($=[{uid:f,label:l?.displayName,categoryName:l?.category}]),(0,n.jsx)(ae.l,{disabled:o||!r,error:T,label:C,id:i,name:i,onChange:L=>{d({target:{name:i,value:L,type:"select-category"}})},value:f||"",children:$.map(L=>(0,n.jsx)(Ie.c,{value:L.uid,children:`${L.categoryName} - ${L.label}`},L.uid))})},Gl=({dynamicZoneTarget:e,intlLabel:t,name:s,onChange:r,value:o})=>{const{formatMessage:l}=(0,Y.A)(),{componentsGroupedByCategory:i,modifiedData:d}=ze(),m=Bt(d.contentType.schema.attributes,e)?.components||[],f=Object.keys(i).reduce((C,b)=>{const M=i[b].filter(({uid:U})=>!m.includes(U));return M.length>0&&(C[b]=M),C},{}),p=Object.entries(f).reduce((C,b)=>{const[M,U]=b,$={label:M,children:U.map(({uid:L,schema:{displayName:N}})=>({label:N,value:L}))};return C.push($),C},[]),T=l({id:c("components.SelectComponents.displayed-value"),defaultMessage:"{number, plural, =0 {# components} one {# component} other {# components}} selected"},{number:o?.length??0});return(0,n.jsx)(B.B,{id:"select1",label:l(t),customizeContent:()=>T,name:s,onChange:C=>{r({target:{name:s,value:C,type:"select-components"}})},options:p,value:o||[]})},Yl=({intlLabel:e,error:t=void 0,modifiedData:s,name:r,onChange:o,options:l,value:i=""})=>{const{formatMessage:d}=(0,Y.A)(),g=d(e),m=t?d({id:t,defaultMessage:t}):"",f=p=>{o({target:{name:r,value:p,type:"select"}}),i&&s.default!==void 0&&s.default!==null&&o({target:{name:"default",value:null}})};return(0,n.jsx)(ae.l,{error:m,label:g,id:r,name:r,onChange:f,value:i||"",children:l.map(({metadatas:{intlLabel:p,disabled:T,hidden:C},key:b,value:M})=>(0,n.jsx)(Ie.c,{value:M,disabled:T,hidden:C,children:d({id:p.id,defaultMessage:p.defaultMessage},p.values)},b))})},ss=({intlLabel:e,error:t=void 0,modifiedData:s,name:r,onChange:o,options:l,value:i=""})=>{const{formatMessage:d}=(0,Y.A)(),g=d(e),m=t?d({id:t,defaultMessage:t}):"",f=p=>{o({target:{name:r,value:p,type:"select"}}),i&&(p==="biginteger"&&i!=="biginteger"&&(s.default!==void 0&&s.default!==null&&o({target:{name:"default",value:null}}),s.max!==void 0&&s.max!==null&&o({target:{name:"max",value:null}}),s.min!==void 0&&s.min!==null&&o({target:{name:"min",value:null}})),typeof p=="string"&&["decimal","float","integer"].includes(p)&&i==="biginteger"&&(s.default!==void 0&&s.default!==null&&o({target:{name:"default",value:null}}),s.max!==void 0&&s.max!==null&&o({target:{name:"max",value:null}}),s.min!==void 0&&s.min!==null&&o({target:{name:"min",value:null}})))};return(0,n.jsx)(ae.l,{error:m,label:g,id:r,name:r,onChange:f,value:i||"",children:l.map(({metadatas:{intlLabel:p,disabled:T,hidden:C},key:b,value:M})=>(0,n.jsx)(Ie.c,{value:M,disabled:T,hidden:C,children:d(p)},b))})};ss.defaultProps={error:void 0,value:""};const Kl=({description:e=null,error:t=null,intlLabel:s,modifiedData:r,name:o,onChange:l,value:i=null})=>{const{formatMessage:d}=(0,Y.A)(),g=(0,u.useRef)(l),m=r?.displayName||"";(0,u.useEffect)(()=>{m?g.current({target:{name:o,value:(0,A.n)(m)}}):g.current({target:{name:o,value:""}})},[m,o]);const f=t?d({id:t,defaultMessage:t}):"",p=e?d({id:e.id,defaultMessage:e.defaultMessage},{...e.values}):"",T=d(s);return(0,n.jsx)(je.k,{error:f,label:T,id:o,hint:p,name:o,onChange:l,value:i||""})},as=({form:e,formErrors:t,genericInputProps:s,modifiedData:r,onChange:o})=>{const{formatMessage:l}=(0,Y.A)();return(0,n.jsx)(n.Fragment,{children:e.map((i,d)=>i.items.length===0?null:(0,n.jsxs)(h.a,{children:[i.sectionTitle&&(0,n.jsx)(h.a,{paddingBottom:4,children:(0,n.jsx)(S.o,{variant:"delta",as:"h3",children:l(i.sectionTitle)})}),(0,n.jsx)(q.x,{gap:4,children:i.items.map((g,m)=>{const f=`${d}.${m}`,p=D(r,g.name,void 0),T=Object.keys(t).find(b=>b===g.name),C=T?t[T].id:D(t,[...g.name.split(".").filter(b=>b!=="componentToCreate"),"id"],null);return g.type==="pushRight"?(0,n.jsx)(te.E,{col:g.size||6,children:(0,n.jsx)("div",{})},g.name||f):(0,n.jsx)(te.E,{col:g.size||6,children:(0,n.jsx)(F.ah,{...g,...s,error:C,onChange:o,value:p})},g.name||f)})})]},d))})},Ql=({description:e=null,disabled:t=!1,error:s="",intlLabel:r,labelAction:o,name:l,onChange:i,placeholder:d=null,value:g=""})=>{const{formatMessage:m}=(0,Y.A)(),f=s?m({id:s,defaultMessage:s}):"",p=e?m({id:e.id,defaultMessage:e.defaultMessage},{...e.values}):"",T=m(r),C=d?m({id:d.id,defaultMessage:d.defaultMessage},{...d.values}):"",b=Array.isArray(g)?g.join(`
`):"",M=U=>{const $=U.target.value.split(`
`);i({target:{name:l,value:$}})};return(0,n.jsx)(Bs.T,{disabled:t,error:f,label:T,labelAction:o,id:l,hint:p,name:l,onChange:M,placeholder:C,value:b,children:b})},Pe={name:"name",type:"text",intlLabel:{id:"global.name",defaultMessage:"Name"},description:{id:c("modalForm.attribute.form.base.name.description"),defaultMessage:"No space is allowed for the name of the attribute"}},Xl={sections:[{sectionTitle:null,items:[Pe]}]},_e={base(e=""){return[{sectionTitle:null,items:[{name:`${e}displayName`,type:"text",intlLabel:{id:c("contentType.displayName.label"),defaultMessage:"Display Name"}},{name:`${e}category`,type:"select-category",intlLabel:{id:c("modalForm.components.create-component.category.label"),defaultMessage:"Select a category or enter a name to create a new one"}}]},{sectionTitle:null,items:[{name:`${e}icon`,type:"icon-picker",size:12,intlLabel:{id:c("modalForm.components.icon.label"),defaultMessage:"Icon"}}]}]},advanced(){return[]}},R={default:{name:"default",type:"text",intlLabel:{id:c("form.attribute.settings.default"),defaultMessage:"Default value"}},max:{name:"max",type:"checkbox-with-number-field",intlLabel:{id:c("form.attribute.item.maximum"),defaultMessage:"Maximum value"}},maxLength:{name:"maxLength",type:"checkbox-with-number-field",intlLabel:{id:c("form.attribute.item.maximumLength"),defaultMessage:"Maximum length"}},min:{name:"min",type:"checkbox-with-number-field",intlLabel:{id:c("form.attribute.item.minimum"),defaultMessage:"Minimum value"}},minLength:{name:"minLength",type:"checkbox-with-number-field",intlLabel:{id:c("form.attribute.item.minimumLength"),defaultMessage:"Minimum length"}},private:{name:"private",type:"checkbox",intlLabel:{id:c("form.attribute.item.privateField"),defaultMessage:"Private field"},description:{id:c("form.attribute.item.privateField.description"),defaultMessage:"This field will not show up in the API response"}},regex:{intlLabel:{id:c("form.attribute.item.text.regex"),defaultMessage:"RegExp pattern"},name:"regex",type:"text",description:{id:c("form.attribute.item.text.regex.description"),defaultMessage:"The text of the regular expression"}},required:{name:"required",type:"checkbox",intlLabel:{id:c("form.attribute.item.requiredField"),defaultMessage:"Required field"},description:{id:c("form.attribute.item.requiredField.description"),defaultMessage:"You won't be able to create an entry if this field is empty"}},unique:{name:"unique",type:"checkbox",intlLabel:{id:c("form.attribute.item.uniqueField"),defaultMessage:"Unique field"},description:{id:c("form.attribute.item.uniqueField.description"),defaultMessage:"You won't be able to create an entry if there is an existing entry with identical content"}}},Jl={blocks(){return{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},boolean(){return{sections:[{sectionTitle:null,items:[{autoFocus:!0,type:"select-default-boolean",intlLabel:{id:c("form.attribute.settings.default"),defaultMessage:"Default value"},name:"default",options:[{value:"true",key:"true",metadatas:{intlLabel:{id:"true",defaultMessage:"true"}}},{value:"",key:"null",metadatas:{intlLabel:{id:"null",defaultMessage:"null"}}},{value:"false",key:"false",metadatas:{intlLabel:{id:"false",defaultMessage:"false"}}}]}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},component({repeatable:e},t){return t==="1"?{sections:_e.advanced()}:e?{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private,R.max,R.min]}]}:{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},date({type:e}){return{sections:[{sectionTitle:null,items:[{...R.default,type:e||"date",value:null,withDefaultValue:!1,disabled:!e,autoFocus:!1}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.unique,R.private]}]}},dynamiczone(){return{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.max,R.min]}]}},email(){return{sections:[{sectionTitle:null,items:[{...R.default,type:"email"}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.unique,R.maxLength,R.minLength,R.private]}]}},enumeration(e){return{sections:[{sectionTitle:null,items:[{name:"default",type:"select",intlLabel:{id:c("form.attribute.settings.default"),defaultMessage:"Default value"},validations:{},options:[{key:"__null_reset_value__",value:"",metadatas:{intlLabel:{id:"components.InputSelect.option.placeholder",defaultMessage:"Choose here"}}},...(e.enum||[]).filter((t,s)=>e.enum.indexOf(t)===s&&t).map(t=>({key:t,value:t,metadatas:{intlLabel:{id:`${t}.no-override`,defaultMessage:t}}}))]},{intlLabel:{id:c("form.attribute.item.enumeration.graphql"),defaultMessage:"Name override for GraphQL"},name:"enumName",type:"text",validations:{},description:{id:c("form.attribute.item.enumeration.graphql.description"),defaultMessage:"Allows you to override the default generated name for GraphQL"}}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},json(){return{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},media(){return{sections:[{sectionTitle:null,items:[{intlLabel:{id:c("form.attribute.media.allowed-types"),defaultMessage:"Select allowed types of media"},name:"allowedTypes",type:"allowed-types-select",size:7,value:"",validations:{}}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.private]}]}},number(e){const t=e.type==="decimal"||e.type==="float"?"any":1;return{sections:[{sectionTitle:null,items:[{autoFocus:!0,name:"default",type:e.type==="biginteger"?"text":"number",step:t,intlLabel:{id:c("form.attribute.settings.default"),defaultMessage:"Default value"},validations:{}}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.unique,R.max,R.min,R.private]}]}},password(){return{sections:[{sectionTitle:null,items:[R.default]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.maxLength,R.minLength,R.private]}]}},relation(){return{sections:[{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.private]}]}},richtext(){return{sections:[{sectionTitle:null,items:[R.default]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.maxLength,R.minLength,R.private]}]}},text(){return{sections:[{sectionTitle:null,items:[R.default,R.regex]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.unique,R.maxLength,R.minLength,R.private]}]}},uid(e){return{sections:[{sectionTitle:null,items:[{...R.default,disabled:Boolean(e.targetField),type:"text"}]},{sectionTitle:{id:"global.settings",defaultMessage:"Settings"},items:[R.required,R.maxLength,R.minLength,R.private]}]}}},Wt={intlLabel:{id:"global.type",defaultMessage:"Type"},name:"createComponent",type:"boolean-radio-group",size:12,radios:[{title:{id:c("form.attribute.component.option.create"),defaultMessage:"Create a new component"},description:{id:c("form.attribute.component.option.create.description"),defaultMessage:"A component is shared across types and components, it will be available and accessible everywhere."},value:!0},{title:{id:c("form.attribute.component.option.reuse-existing"),defaultMessage:"Use an existing component"},description:{id:c("form.attribute.component.option.reuse-existing.description"),defaultMessage:"Reuse a component already created to keep your data consistent across content-types."},value:!1}]},os={advanced:Jl,base:{component(e,t){if(t==="1"){const s=e.createComponent===!0?_e.base("componentToCreate."):[];return{sections:[{sectionTitle:null,items:[Wt]},...s]}}return{sections:[{sectionTitle:null,items:[Pe,{name:"component",type:"select-component",intlLabel:{id:c("modalForm.attributes.select-component"),defaultMessage:"Select a component"},isMultiple:!1}]},{sectionTitle:null,items:[{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"repeatable",type:"boolean-radio-group",size:12,radios:[{title:{id:c("form.attribute.component.option.repeatable"),defaultMessage:"Repeatable component"},description:{id:c("form.attribute.component.option.repeatable.description"),defaultMessage:"Best for multiple instances (array) of ingredients, meta tags, etc.."},value:!0},{title:{id:c("form.attribute.component.option.single"),defaultMessage:"Single component"},description:{id:c("form.attribute.component.option.single.description"),defaultMessage:"Best for grouping fields like full address, main information, etc..."},value:!1}]}]}]}},date(){return{sections:[{sectionTitle:null,items:[Pe,{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"type",type:"select-date",options:[{key:"__null_reset_value__",value:"",metadatas:{intlLabel:{id:"components.InputSelect.option.placeholder",defaultMessage:"Choose here"},hidden:!0}},{key:"date",value:"date",metadatas:{intlLabel:{id:c("form.attribute.item.date.type.date"),defaultMessage:"date (ex: 01/01/{currentYear})",values:{currentYear:new Date().getFullYear()}}}},{key:"datetime",value:"datetime",metadatas:{intlLabel:{id:c("form.attribute.item.date.type.datetime"),defaultMessage:"datetime (ex: 01/01/{currentYear} 00:00 AM)",values:{currentYear:new Date().getFullYear()}}}},{key:"time",value:"time",metadatas:{intlLabel:{id:c("form.attribute.item.date.type.time"),defaultMessage:"time (ex: 00:00 AM)"}}}]}]}]}},enumeration(){return{sections:[{sectionTitle:null,items:[Pe]},{sectionTitle:null,items:[{name:"enum",type:"textarea-enum",size:6,intlLabel:{id:c("form.attribute.item.enumeration.rules"),defaultMessage:"Values (one line per value)"},placeholder:{id:c("form.attribute.item.enumeration.placeholder"),defaultMessage:`Ex:
morning
noon
evening`},validations:{required:!0}}]}]}},media(){return{sections:[{sectionTitle:null,items:[Pe]},{sectionTitle:null,items:[{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"multiple",size:12,type:"boolean-radio-group",radios:[{title:{id:c("form.attribute.media.option.multiple"),defaultMessage:"Multiple media"},description:{id:c("form.attribute.media.option.multiple.description"),defaultMessage:"Best for sliders, carousels or multiple files download"},value:!0},{title:{id:c("form.attribute.media.option.single"),defaultMessage:"Single media"},description:{id:c("form.attribute.media.option.single.description"),defaultMessage:"Best for avatar, profile picture or cover"},value:!1}]}]}]}},number(){return{sections:[{sectionTitle:null,items:[Pe,{intlLabel:{id:c("form.attribute.item.number.type"),defaultMessage:"Number format"},name:"type",type:"select-number",options:[{key:"__null_reset_value__",value:"",metadatas:{intlLabel:{id:"components.InputSelect.option.placeholder",defaultMessage:"Choose here"},hidden:!0}},{key:"integer",value:"integer",metadatas:{intlLabel:{id:c("form.attribute.item.number.type.integer"),defaultMessage:"integer (ex: 10)"}}},{key:"biginteger",value:"biginteger",metadatas:{intlLabel:{id:c("form.attribute.item.number.type.biginteger"),defaultMessage:"biginteger (ex: 123456789)"}}},{key:"decimal",value:"decimal",metadatas:{intlLabel:{id:c("form.attribute.item.number.type.decimal"),defaultMessage:"decimal (ex: 2.22)"}}},{key:"float",value:"float",metadatas:{intlLabel:{id:c("form.attribute.item.number.type.float"),defaultMessage:"decimal (ex: 3.3333333)"}}}]}]}]}},relation(){return{sections:[{sectionTitle:null,items:[{intlLabel:{id:"FIXME",defaultMessage:"FIXME"},name:"relation",size:12,type:"relation"}]}]}},string(){return{sections:[{sectionTitle:null,items:[Pe]},{sectionTitle:null,items:[{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"type",size:12,type:"radio-group",radios:[{title:{id:c("form.attribute.text.option.short-text"),defaultMessage:"Sort text"},description:{id:c("form.attribute.text.option.short-text.description"),defaultMessage:"Best for titles, names, links (URL). It also enables exact search on the field."},value:"string"},{title:{id:c("form.attribute.text.option.long-text"),defaultMessage:"Long text"},description:{id:c("form.attribute.text.option.long-text.description"),defaultMessage:"Best for descriptions, biography. Exact search is disabled."},value:"text"}]}]}]}},text(){return{sections:[{sectionTitle:null,items:[Pe]},{sectionTitle:null,items:[{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"type",size:12,type:"radio-group",radios:[{title:{id:c("form.attribute.text.option.short-text"),defaultMessage:"Sort text"},description:{id:c("form.attribute.text.option.short-text.description"),defaultMessage:"Best for titles, names, links (URL). It also enables exact search on the field."},value:"string"},{title:{id:c("form.attribute.text.option.long-text"),defaultMessage:"Long text"},description:{id:c("form.attribute.text.option.long-text.description"),defaultMessage:"Best for descriptions, biography. Exact search is disabled."},value:"text"}]}]}]}},uid(e,t,s){const r=s.filter(({type:o})=>["string","text"].includes(o)).map(({name:o})=>({key:o,value:o,metadatas:{intlLabel:{id:`${o}.no-override`,defaultMessage:o}}}));return{sections:[{sectionTitle:null,items:[{...Pe,placeholder:{id:c("modalForm.attribute.form.base.name.placeholder"),defaultMessage:"e.g. slug, seoUrl, canonicalUrl"}},{intlLabel:{id:c("modalForm.attribute.target-field"),defaultMessage:"Attached field"},name:"targetField",type:"select",options:[{key:"__null_reset_value__",value:"",metadatas:{intlLabel:{id:"global.none",defaultMessage:"None"}}},...r]}]}]}}}},zt=e=>e?al(e,{decamelize:!1,lowercase:!1,separator:"_"}):"",rs=/^[A-Za-z][_0-9A-Za-z]*$/,is=e=>({name:"attributeNameAlreadyUsed",message:F.iW.unique,test(t){return t?!e.includes(t):!1}}),Ut=e=>({name:"forbiddenAttributeName",message:c("error.attributeName.reserved-name"),test(t){return t?!e.includes(t):!1}}),y={default:()=>j.Yj().nullable(),max:()=>j.ai().integer().nullable(),min:()=>j.ai().integer().when("max",(e,t)=>e?t.max(e,c("error.validation.minSupMax")):t).nullable(),maxLength:()=>j.ai().integer().positive(c("error.validation.positive")).nullable(),minLength:()=>j.ai().integer().min(0).when("maxLength",(e,t)=>e?t.max(e,c("error.validation.minSupMax")):t).nullable(),name(e,t){return j.Yj().test(is(e)).test(Ut(t)).matches(rs,F.iW.regex).required(F.iW.required)},required:()=>j.zM(),type:()=>j.Yj().required(F.iW.required),unique:()=>j.zM().nullable()},Vt=(e,t)=>({name:y.name(e,t),type:y.type(),default:y.default(),unique:y.unique(),required:y.required(),maxLength:y.maxLength(),minLength:y.minLength(),regex:j.Yj().test({name:"isValidRegExpPattern",message:c("error.validation.regex"),test(r){return new RegExp(r||"")!==null}}).nullable()}),Zt=()=>({name:"isMinSuperiorThanMax",message:c("error.validation.minSupMax"),test(e){if(!e)return!0;const{max:t}=this.parent;return!t||Number.isNaN(Ot(e))?!0:Ot(t)>=Ot(e)}}),dt={date(e,t){const s={name:y.name(e,t),type:y.type()};return j.Ik(s)},datetime(e,t){const s={name:y.name(e,t),type:y.type()};return j.Ik(s)},time(e,t){const s={name:y.name(e,t),type:y.type()};return j.Ik(s)},default(e,t){const s={name:y.name(e,t),type:y.type()};return j.Ik(s)},biginteger(e,t){const s={name:y.name(e,t),type:y.type(),default:j.Yj().nullable().matches(/^-?\d*$/),unique:y.unique(),required:y.required(),max:j.Yj().nullable().matches(/^-?\d*$/,F.iW.regex),min:j.Yj().nullable().test(Zt()).matches(/^-?\d*$/,F.iW.regex)};return j.Ik(s)},boolean(e,t){const s={name:y.name(e,t),default:j.zM().nullable(),required:y.required(),unique:y.unique()};return j.Ik(s)},component(e,t){const s={name:y.name(e,t),type:y.type(),required:y.required(),max:y.max(),min:y.min(),component:j.Yj().required(F.iW.required)};return j.Ik(s)},decimal(e,t){const s={name:y.name(e,t),type:y.type(),default:j.ai(),required:y.required(),max:j.ai(),min:j.ai().test(Zt())};return j.Ik(s)},dynamiczone(e,t){const s={name:y.name(e,t),type:y.type(),required:y.required(),max:y.max(),min:y.min()};return j.Ik(s)},email(e,t){const s={name:y.name(e,t),type:y.type(),default:j.Yj().email().nullable(),unique:y.unique(),required:y.required(),maxLength:y.maxLength(),minLength:y.minLength()};return j.Ik(s)},enumeration(e,t){const s=/^[_A-Za-z][_0-9A-Za-z]*$/,r={name:j.Yj().test(is(e)).test(Ut(t)).matches(s,F.iW.regex).required(F.iW.required),type:y.type(),default:y.default(),unique:y.unique(),required:y.required(),enum:j.YO().of(j.Yj()).min(1,F.iW.min).test({name:"areEnumValuesUnique",message:c("error.validation.enum-duplicate"),test(o){return o?!sl(o.map(zt).filter((i,d,g)=>g.indexOf(i)!==d)).length:!1}}).test({name:"doesNotHaveEmptyValues",message:c("error.validation.enum-empty-string"),test:o=>o?!o.map(zt).some(l=>l===""):!1}).test({name:"doesMatchRegex",message:c("error.validation.enum-regex"),test:o=>o?o.map(zt).every(l=>s.test(l)):!1}),enumName:j.Yj().nullable()};return j.Ik(r)},float(e,t){const s={name:y.name(e,t),type:y.type(),required:y.required(),default:j.ai(),max:j.ai(),min:j.ai().test(Zt())};return j.Ik(s)},integer(e,t){const s={name:y.name(e,t),type:y.type(),default:j.ai().integer(),unique:y.unique(),required:y.required(),max:y.max(),min:y.min()};return j.Ik(s)},json(e,t){const s={name:y.name(e,t),type:y.type(),required:y.required(),unique:y.unique()};return j.Ik(s)},media(e,t){const s={name:y.name(e,t),type:y.type(),multiple:j.zM(),required:y.required(),allowedTypes:j.YO().of(j.Yj().oneOf(["images","videos","files","audios"])).min(1).nullable()};return j.Ik(s)},password(e,t){const s={name:y.name(e,t),type:y.type(),default:y.default(),unique:y.unique(),required:y.required(),maxLength:y.maxLength(),minLength:y.minLength()};return j.Ik(s)},relation(e,t,s,{initialData:r,modifiedData:o}){const l={name:y.name(e,t),target:j.Yj().required(F.iW.required),relation:j.Yj().required(),type:j.Yj().required(),targetAttribute:j.RZ(()=>{const i=(0,A.g)(o.relation,o.targetAttribute);if(i==="oneWay"||i==="manyWay")return j.Yj().nullable();const d=j.Yj().test(Ut(t)),m=[...s.map(({name:f})=>f),o.name].filter(f=>f!==r.targetAttribute);return d.matches(rs,F.iW.regex).test({name:"forbiddenTargetAttributeName",message:c("error.validation.relation.targetAttribute-taken"),test(f){return f?!m.includes(f):!1}}).required(F.iW.required)})};return j.Ik(l)},richtext(e,t){const s={name:y.name(e,t),type:y.type(),default:y.default(),unique:y.unique(),required:y.required(),maxLength:y.maxLength(),minLength:y.minLength()};return j.Ik(s)},blocks(e,t){const s={name:y.name(e,t),type:y.type(),default:y.default(),unique:y.unique(),required:y.required(),maxLength:y.maxLength(),minLength:y.minLength()};return j.Ik(s)},string(e,t){const s=Vt(e,t);return j.Ik(s)},text(e,t){const s=Vt(e,t);return j.Ik(s)},uid(e,t){const s=Vt(e,t);return j.Ik(s)}},ls=/^[A-Za-z][-_0-9A-Za-z]*$/,ql=e=>{const t={name:j.Yj().matches(ls,F.iW.regex).test({name:"nameNotAllowed",message:F.iW.unique,test(s){return s?!e.includes(s?.toLowerCase()):!1}}).required(F.iW.required)};return j.Ik(t)},_l={base:{sections:[{sectionTitle:null,items:[{autoFocus:!0,name:"name",type:"text",intlLabel:{id:"global.name",defaultMessage:"Name"},description:{id:c("modalForm.editCategory.base.name.description"),defaultMessage:"No space is allowed for the name of the category"}}]}]}},ed=(e,t,s)=>{const r={displayName:j.Yj().test({name:"nameAlreadyUsed",message:F.iW.unique,test(o){if(!o)return!1;const l=(0,A.c)(o,s);return!e.includes(l)}}).test({name:"nameNotAllowed",message:c("error.contentTypeName.reserved-name"),test(o){return o?!t.includes(o?.trim()?.toLowerCase()):!1}}).required(F.iW.required),category:j.Yj().matches(ls,F.iW.regex).required(F.iW.required),icon:j.Yj()};return j.Ik(r)},ds={name:"displayName",type:"text",intlLabel:{id:c("contentType.displayName.label"),defaultMessage:"Display name"}},Ht={advanced:{default(){return{sections:[{items:[{intlLabel:{id:c("contentType.draftAndPublish.label"),defaultMessage:"Draft & publish"},description:{id:c("contentType.draftAndPublish.description"),defaultMessage:"Allows writing a draft version of an entry, before it is published"},name:"draftAndPublish",type:"toggle-draft-publish",validations:{}}]}]}}},base:{create(){return{sections:[{sectionTitle:null,items:[ds,{description:{id:c("contentType.apiId-singular.description"),defaultMessage:"Used to generate the API routes and databases tables/collections"},intlLabel:{id:c("contentType.apiId-singular.label"),defaultMessage:"API ID (Singular)"},name:"singularName",type:"text-singular"},{type:"pushRight",size:6,intlLabel:{id:"",defaultMessage:""},name:"pushRight"},{description:{id:c("contentType.apiId-plural.description"),defaultMessage:"Pluralized API ID"},intlLabel:{id:c("contentType.apiId-plural.label"),defaultMessage:"API ID (Plural)"},name:"pluralName",type:"text-plural"}]}]}},edit(){return{sections:[{sectionTitle:null,items:[ds,{disabled:!0,description:{id:c("contentType.apiId-singular.description"),defaultMessage:"Used to generate the API routes and databases tables/collections"},intlLabel:{id:c("contentType.apiId-singular.label"),defaultMessage:"API ID (Singular)"},name:"singularName",type:"text"},{type:"pushRight",size:6,intlLabel:{id:"",defaultMessage:""},name:"pushRight"},{disabled:!0,description:{id:c("contentType.apiId-plural.description"),defaultMessage:"Pluralized API ID"},intlLabel:{id:c("contentType.apiId-plural.label"),defaultMessage:"API ID (Plural)"},name:"pluralName",type:"text"},{intlLabel:{id:"global.type",defaultMessage:"Type"},name:"kind",type:"content-type-radio-group",size:12,radios:[{title:{id:c("form.button.collection-type.name"),defaultMessage:"Collection Type"},description:{id:c("form.button.collection-type.description"),defaultMessage:"Best for multiple instances like articles, products, comments, etc."},value:"collectionType"},{title:{id:c("form.button.single-type.name"),defaultMessage:"Single Type"},description:{id:c("form.button.single-type.description"),defaultMessage:"Best for single instance like about us, homepage, etc."},value:"singleType"}]}]}]}}}},td=({usedContentTypeNames:e=[],reservedModels:t=[],singularNames:s=[],pluralNames:r=[],collectionNames:o=[]})=>{const l={displayName:j.Yj().test({name:"nameAlreadyUsed",message:F.iW.unique,test(i){if(!i)return!1;const d=(0,A.b)(i);return!e.includes(d)}}).test({name:"nameNotAllowed",message:c("error.contentTypeName.reserved-name"),test(i){return i?!t.includes(i?.trim()?.toLowerCase()):!1}}).required(F.iW.required),pluralName:j.Yj().test({name:"pluralNameAlreadyUsed",message:F.iW.unique,test(i){return i?!r.includes(i):!1}}).test({name:"pluralNameAlreadyUsedAsSingular",message:c("error.contentType.pluralName-equals-singularName"),test(i){return i?!s.includes(i):!1}}).test({name:"pluralAndSingularAreUnique",message:c("error.contentType.pluralName-used"),test(i,d){return i?d.parent.singularName!==i:!1}}).test({name:"pluralNameNotAllowed",message:c("error.contentTypeName.reserved-name"),test(i){return i?!t.includes(i?.trim()?.toLowerCase()):!1}}).test({name:"pluralNameNotAlreadyUsedInCollectionName",message:c("error.contentType.pluralName-equals-collectionName"),test(i){return i?!o.includes(i?.trim()?.toLowerCase()):!1}}).required(F.iW.required),singularName:j.Yj().test({name:"singularNameAlreadyUsed",message:F.iW.unique,test(i){return i?!s.includes(i):!1}}).test({name:"singularNameAlreadyUsedAsPlural",message:c("error.contentType.singularName-equals-pluralName"),test(i){return i?!r.includes(i):!1}}).test({name:"pluralAndSingularAreUnique",message:c("error.contentType.singularName-used"),test(i,d){return i?d.parent.pluralName!==i:!1}}).test({name:"singularNameNotAllowed",message:c("error.contentTypeName.reserved-name"),test(i){return i?!t.includes(i?.trim()?.toLowerCase()):!1}}).required(F.iW.required),draftAndPublish:j.zM(),kind:j.Yj().oneOf(["singleType","collectionType"]),reviewWorkflows:j.zM()};return j.Ik(l)},Gt={advanced:{default(){return{sections:_e.advanced()}}},base:{createComponent(){return{sections:[{sectionTitle:null,items:[Wt]},..._e.base("componentToCreate.")]}},default(){return{sections:[{sectionTitle:null,items:[Wt]},{sectionTitle:null,items:[{type:"pushRight",size:6,intlLabel:{id:"",defaultMessage:""},name:"pushRight"},{name:"components",type:"select-components",intlLabel:{id:c("modalForm.attributes.select-components"),defaultMessage:"Select the components"},isMultiple:!0}]}]}}}},cs=(e,t)=>{e.forEach(s=>{if(!("sectionTitle"in s)){t[0].items?.push(s);return}t.push(s)})},us=(e,t)=>e.filter(({name:s})=>s!==t.initialData.name).map(({name:s})=>s),Ge={customField:{schema({schemaAttributes:e,attributeType:t,customFieldValidator:s,reservedNames:r,schemaData:o,ctbFormsAPI:l}){const i=us(e,o);dt[t];let d;return t==="relation"?d=dt[t](i,r.attributes,[],{initialData:{},modifiedData:{}}):d=dt[t](i,r.attributes),l.makeCustomFieldValidator(d,s,i,r.attributes,o)},form:{base({customField:e}){const t=[{sectionTitle:null,items:[Pe]}];return e.options?.base&&cs(e.options.base,t),{sections:t}},advanced({customField:e,data:t,step:s,extensions:r,...o}){const l=[{sectionTitle:null,items:[]}],i=r.getAdvancedForm(["attribute",e.type],{data:t,type:e.type,step:s,...o});if(e.options?.advanced&&cs(e.options.advanced,l),i){const d={sectionTitle:{id:c("modalForm.custom-fields.advanced.settings.extended"),defaultMessage:"Extended settings"},items:i};l.push(d)}return{sections:l}}}},attribute:{schema(e,t,s,r,o,l){const i=e?.schema?.attributes??[],d=us(i,o);try{const g=dt[t](d,s.attributes,r,o);return l.makeValidator(["attribute",t],g,d,s.attributes,r,o)}catch(g){return console.error("Error yup build schema",g),dt.default(d,s.attributes)}},form:{advanced({data:e,type:t,step:s,extensions:r,...o}){try{const l=os.advanced[t](e,s).sections,i=r.getAdvancedForm(["attribute",t],{data:e,type:t,step:s,...o});return{sections:l.reduce((g,m)=>(m.sectionTitle===null?g.push(m):g.push({...m,items:[...m.items,...i]}),g),[])}}catch(l){return console.error(l),{sections:[]}}},base({data:e,type:t,step:s,attributes:r}){try{return os.base[t](e,s,r)}catch{return Xl}}}},contentType:{schema(e,t,s,r,o,l){const i=Object.values(l).map(b=>b.schema.singularName),d=Object.values(l).map(b=>b?.schema?.pluralName??""),g=t?e.filter(b=>b!==s):e,m=t?i.filter(b=>{const{schema:M}=l[s];return M.singularName!==b}):i,f=t?d.filter(b=>{const{schema:M}=l[s];return M.pluralName!==b}):d,p=Object.values(l).map(b=>b?.schema?.collectionName??""),T=t?p.filter(b=>{const{schema:M}=l[s],U=M.pluralName,$=M.collectionName;return b!==U||b!==$}):p,C=td({usedContentTypeNames:g,reservedModels:r.models,singularNames:m,pluralNames:f,collectionNames:T});return o.makeValidator(["contentType"],C,g,r.models,m,f)},form:{base({actionType:e}){return e==="create"?Ht.base.create():Ht.base.edit()},advanced({extensions:e}){const t=Ht.advanced.default().sections.map(r=>r.items).flat(),s=e.getAdvancedForm(["contentType"]);return{sections:[{items:[...t,...s]}]}}}},component:{schema(e,t,s,r=!1,o=null){const l=r?e.filter(i=>i!==o):e;return ed(l,s.models,t)},form:{advanced(){return{sections:_e.advanced()}},base(){return{sections:_e.base()}}}},addComponentToDynamicZone:{form:{advanced(){return Gt.advanced.default()},base({data:e}){return e?.createComponent??!1?Gt.base.createComponent():Gt.base.default()}}},editCategory:{schema(e,t){const s=e.filter(r=>r!==t.name).map(r=>r.toLowerCase());return ql(s)},form:{advanced:()=>({sections:[]}),base(){return _l.base}}}},nd=()=>e=>e[`${A.p}_formModal`]||A.i,sd=()=>(0,Qn.Mz)(nd(),e=>e),ad=(e,t)=>{const s=D(e,["contentType","schema","kind"],"");return s==="singleType"||s===t.kind?!0:D(e,["contentType","schema","attributes"],[]).filter(({relation:l,type:i,targetAttribute:d})=>{const g=(0,A.g)(l,d);return i==="relation"&&!["oneWay","manyWay"].includes(g||"")}).length===0},od=(e="",t,s)=>{const r=["text","boolean","blocks","json","number","email","date","password","media","enumeration","relation","richtext"],o=e==="contentType",l=s.includes(t),i=!o&&!l;return o?[[...r.slice(0,-1),"uid",...r.slice(-1)],["component","dynamiczone"]]:i?[r,["component"]]:[r]},ms=e=>e.reduce((t,s)=>{const r=s.items.reduce((o,l)=>(l.name&&o.push(l.name),o),[]);return[...t,...r]},[]),rd=()=>{const{onCloseModal:e,onNavigateToChooseAttributeModal:t,onNavigateToAddCompoToDZModal:s,onNavigateToCreateComponentStep2:r,actionType:o,attributeName:l,attributeType:i,customFieldUid:d,categoryName:g,dynamicZoneTarget:m,forTarget:f,modalType:p,isOpen:T,kind:C,step:b,targetUid:M,showBackLink:U}=Je(),$=(0,F.AC)().get(d),L=(0,u.useRef)(),N=(0,u.useMemo)(sd,[]),k=(0,Xe.wA)(),_=(0,F.hN)(),he=(0,Xe.d4)(H=>N(H),Xe.bN),{push:Me}=(0,Fe.W6)(),{trackUsage:V}=(0,F.z1)(),{formatMessage:Ce}=(0,Y.A)(),{getPlugin:ee}=(0,F.vD)(),pe=ee(A.p)?.apis.forms,le=pe.components.inputs,{addAttribute:Ue,addCustomFieldAttribute:ye,addCreatedComponentToDynamicZone:J,allComponentsCategories:I,changeDynamicZoneComponents:Yt,contentTypes:et,components:ut,createSchema:tt,deleteCategory:Kt,deleteData:Ct,editCategory:Qt,editCustomFieldAttribute:Xt,submitData:Jt,modifiedData:be,nestedComponents:qt,setModifiedData:_t,sortedContentTypesList:en,updateSchema:jt,reservedNames:Ye}=ze(),{componentToCreate:mt,formErrors:Ve,initialData:ge,isCreatingComponentWhileAddingAField:pt,modifiedData:x}=he,E=f==="contentType"||f==="component"?[f]:[f,M];(0,u.useEffect)(()=>{if(T){const H=en.filter(_n);p==="editCategory"&&_t(),o==="edit"&&p==="attribute"&&f==="contentType"&&V("willEditFieldOfContentType");const Se=[...E,"schema","attributes"],Oe=Bt(D(be,Se,[]),m)||null;if(p==="editCategory"&&o==="edit"&&k({type:A.S,modalType:p,actionType:o,data:{name:g}}),p==="contentType"&&o==="create"&&k({type:A.S,modalType:p,actionType:o,data:{draftAndPublish:!0},pluginOptions:{}}),p==="contentType"&&o==="edit"){const{displayName:Q,draftAndPublish:fe,kind:Ne,pluginOptions:Ae,pluralName:zd,reviewWorkflows:Ud,singularName:Vd}=D(be,[...E,"schema"],{displayName:null,pluginOptions:{},singularName:null,pluralName:null});k({type:A.S,actionType:o,modalType:p,data:{displayName:Q,draftAndPublish:fe,kind:Ne,pluginOptions:Ae,pluralName:zd,reviewWorkflows:Ud??!1,singularName:Vd}})}if(p==="component"&&o==="edit"){const Q=D(be,E,{});k({type:A.S,actionType:o,modalType:p,data:{displayName:Q.schema.displayName,category:Q.category,icon:Q.schema.icon}})}if(p==="addComponentToDynamicZone"&&o==="edit"){const Q={...Oe,components:[],name:m,createComponent:!1,componentToCreate:{type:"component"}};k({type:A.d,attributeToEdit:Q})}if(i){const fe={...Bt(D(be,Se,[]),l),name:l};i==="component"&&o==="edit"&&(fe.repeatable||Gn(fe,"repeatable",!1)),k(p==="customField"?{type:A.e,customField:$,isEditing:o==="edit",modifiedDataToSetForEditing:fe,forTarget:f}:{type:A.f,attributeType:i,nameToSetForRelation:D(H,["0","title"],"error"),targetUid:D(H,["0","uid"],"error"),isEditing:o==="edit",modifiedDataToSetForEditing:fe,step:b,forTarget:f})}}else k({type:A.R})},[o,l,i,g,m,f,T,p]);const Z=p==="contentType",ue=p==="component",ve=p==="attribute",we=p==="customField",De=i==="component"&&ve,Ke=o==="create",Qe=D(x,"createComponent",!1)||pt,nt=b==="1",Cs=p==="editCategory",js=p==="chooseAttribute",tn=(0,A.b)(x.displayName||""),nn=D(be,[...E,"schema","attributes"],null),Sd=async()=>{let H;const Se=Qe&&b==="1"?D(x,"componentToCreate",{}):x;if(Z)H=Ge.contentType.schema(Object.keys(et),o==="edit",D(be,[...E,"uid"],null),Ye,pe,et);else if(ue)H=Ge.component.schema(Object.keys(ut),x.category||"",Ye,o==="edit",D(be,[...E,"uid"],null));else if(we)H=Ge.customField.schema({schemaAttributes:D(be,[...E,"schema","attributes"],[]),attributeType:$.type,reservedNames:Ye,schemaData:{modifiedData:x,initialData:ge},ctbFormsAPI:pe,customFieldValidator:$.options?.validator});else if(De&&Qe&&nt)H=Ge.component.schema(Object.keys(ut),D(x,"componentToCreate.category",""),Ye,pe);else if(ve&&!nt){const Oe=i==="relation"?"relation":x.type;let Q=[];if(Oe==="relation"){const fe=D(x,["target"],null);Q=D(et,[fe,"schema","attributes"],[]).filter(({name:Ae})=>o!=="edit"?!0:Ae!==ge.targetAttribute)}H=Ge.attribute.schema(D(be,E,{}),Oe,Ye,Q,{modifiedData:x,initialData:ge},pe)}else if(Cs)H=Ge.editCategory.schema(I,ge);else if(nt&&Qe)H=Ge.component.schema(Object.keys(ut),D(x,"componentToCreate.category",""),Ye,pe);else return;await H.validate(Se,{abortEarly:!1})},Ts=(0,u.useCallback)(({target:{name:H,value:Se,type:Oe,...Q}})=>{const fe=["enumName","max","min","maxLength","minLength","regex","default"];let Ne;fe.includes(H)&&Se===""?Ne=null:Ne=Se;const Ae=Object.assign({},Ve);H==="max"&&delete Ae.min,H==="maxLength"&&delete Ae.minLength,delete Ae[H],k({type:A.h,errors:Ae}),k({type:A.j,keys:H.split("."),value:Ne,...Q})},[k,Ve]),Le=async(H,Se=Ke)=>{H.preventDefault();try{await Sd(),Nd(Se);const Oe=f==="components"?M:tn;if(Z)if(Ke)tt({...x,kind:C},p,tn),Me({pathname:`/plugins/${A.p}/content-types/${tn}`}),t({forTarget:f,targetUid:Oe});else{ad(be,x)?(e(),Jt(x)):_({type:"warning",message:{id:"notification.contentType.relations.conflict"}});return}else if(p==="component")if(Ke){const Q=(0,A.c)(x.displayName,x.category),{category:fe,...Ne}=x;tt(Ne,"component",Q,fe),Me({pathname:`/plugins/${A.p}/component-categories/${fe}/${Q}`}),t({forTarget:f,targetUid:Q})}else{jt(x,p,M),e();return}else if(Cs){if(Yn(ge.name)===Yn(x.name)){e();return}Qt(ge.name,x);return}else if(we){const Q={attributeToSet:{...x,customField:d},forTarget:f,targetUid:M,initialAttribute:ge};o==="edit"?Xt(Q):ye(Q),Se?t({forTarget:f,targetUid:Oe}):e();return}else if(ve&&!Qe){if(i==="dynamiczone"){Ue(x,f,M,o==="edit",ge),Ke?(k({type:A.k}),L.current!==void 0&&L.current._handlers.setSelectedTabIndex(0),s({dynamicZoneTarget:x.name})):e();return}if(!De){Ue(x,f,M,o==="edit",ge),Se?t({forTarget:f,targetUid:Oe}):e();return}if(nt){r(),k({type:A.l,forTarget:f});return}Ue(x,f,M,o==="edit",ge,!0),Se?t({forTarget:f,targetUid:M}):e()}else if(ve&&Qe){if(nt){V("willCreateComponentFromAttributesModal"),k({type:A.m,forTarget:f}),r();return}const{category:Q,type:fe,...Ne}=mt,Ae=(0,A.c)(mt.displayName,Q);tt(Ne,fe,Ae,Q,Qe),Ue(x,f,M,!1),k({type:A.R}),Se?t({forTarget:"components",targetUid:Ae}):e();return}else{if(nt)if(Qe){const{category:Q,type:fe,...Ne}=x.componentToCreate,Ae=(0,A.c)(x.componentToCreate.displayName,Q);tt(Ne,fe,Ae,Q,Qe),J(m,[Ae]),t({forTarget:"components",targetUid:Ae})}else Yt(m,x.components),e();else console.error("This case is not handled");return}k({type:A.R})}catch(Oe){const Q=(0,F.ed)(Oe);k({type:A.h,errors:Q})}},Fd=()=>{window.confirm(Ce({id:"window.confirm.close-modal.file",defaultMessage:"Are you sure? Your changes will be lost."}))&&(e(),k({type:A.R}))},Ms=()=>{wt(x,ge)?(e(),k({type:A.R})):Fd()},Ld=H=>{if(H==="advanced"){if(Z){V("didSelectContentTypeSettings");return}f==="contentType"&&V("didSelectContentTypeFieldSettings")}},Nd=H=>{p==="attribute"&&f==="contentType"&&i!=="dynamiczone"&&H&&V("willAddMoreFieldToContentType")},Id=()=>!!(p==="editCategory"||p==="component"||tl(x,"createComponent")),Rd=od(f,M,qt);if(!T||!p)return null;const $s=D(Ge,[p,"form"],{advanced:()=>({sections:[]}),base:()=>({sections:[]})}),Ed=f==="components"||f==="component",Ss={customInputs:{"allowed-types-select":cl,"boolean-radio-group":Tl,"checkbox-with-number-field":Ml,"icon-picker":wl,"content-type-radio-group":$l,"radio-group":Pt,relation:Vl,"select-category":Zl,"select-component":Hl,"select-components":Gl,"select-default-boolean":Cl,"select-number":ss,"select-date":Yl,"toggle-draft-publish":Sl,"text-plural":Dl,"text-singular":Kl,"textarea-enum":Ql,...le},componentToCreate:mt,dynamicZoneTarget:m,formErrors:Ve,isAddingAComponentToAnotherComponent:Ed,isCreatingComponentWhileAddingAField:pt,mainBoxHeader:D(be,[...E,"schema","displayName"],""),modifiedData:x,naturePickerType:f,isCreating:Ke,targetUid:M,forTarget:f},Fs=$s.advanced({data:x,type:i,step:b,actionType:o,attributes:nn,extensions:pe,forTarget:f,contentTypeSchema:be.contentType||{},customField:$}).sections,Ls=$s.base({data:x,type:i,step:b,actionType:o,attributes:nn,extensions:pe,forTarget:f,contentTypeSchema:be.contentType||{},customField:$}).sections,wd=ms(Ls),Dd=ms(Fs),Od=Object.keys(Ve).some(H=>wd.includes(H)),Bd=Object.keys(Ve).some(H=>Dd.includes(H)),Pd=D(et,[M,"schema","kind"]),kd=()=>o==="edit"&&nn.every(({name:H})=>H!==x?.name),Wd=()=>{kd()&&V("didEditFieldNameOnContentType")};return(0,n.jsxs)(Ps.k,{onClose:Ms,labelledBy:"title",children:[(0,n.jsx)(Ll,{actionType:o,attributeName:l,categoryName:g,contentTypeKind:C,dynamicZoneTarget:m,modalType:p,forTarget:f,targetUid:M,attributeType:i,customFieldUid:d,showBackLink:U}),js&&(0,n.jsx)(Al,{attributes:Rd,forTarget:f,kind:Pd||"collectionType"}),!js&&(0,n.jsxs)("form",{onSubmit:Le,children:[(0,n.jsx)(ke.c,{children:(0,n.jsxs)(me.f,{label:"todo",id:"tabs",variant:"simple",ref:L,onTabChange:H=>{H===1&&Ld("advanced")},children:[(0,n.jsxs)(v.s,{justifyContent:"space-between",children:[(0,n.jsx)(Il,{actionType:o,forTarget:f,kind:C,step:b,modalType:p,attributeType:i,attributeName:l,customField:$}),(0,n.jsxs)(de.t,{children:[(0,n.jsx)(de.o,{hasError:Od,children:Ce({id:c("popUpForm.navContainer.base"),defaultMessage:"Basic settings"})}),(0,n.jsx)(de.o,{hasError:Bd,disabled:Id(),children:Ce({id:c("popUpForm.navContainer.advanced"),defaultMessage:"Advanced settings"})})]})]}),(0,n.jsx)(se.c,{}),(0,n.jsx)(h.a,{paddingTop:6,children:(0,n.jsxs)(re.T,{children:[(0,n.jsx)(re.K,{children:(0,n.jsx)(v.s,{direction:"column",alignItems:"stretch",gap:6,children:(0,n.jsx)(as,{form:Ls,formErrors:Ve,genericInputProps:Ss,modifiedData:x,onChange:Ts})})}),(0,n.jsx)(re.K,{children:(0,n.jsx)(v.s,{direction:"column",alignItems:"stretch",gap:6,children:(0,n.jsx)(as,{form:Fs,formErrors:Ve,genericInputProps:Ss,modifiedData:x,onChange:Ts})})})]})})]})}),(0,n.jsx)(ks.j,{endActions:(0,n.jsx)(Fl,{deleteCategory:Kt,deleteContentType:Ct,deleteComponent:Ct,categoryName:ge.name,isAttributeModal:p==="attribute",isCustomFieldModal:p==="customField",isComponentToDzModal:p==="addComponentToDynamicZone",isComponentAttribute:i==="component",isComponentModal:p==="component",isContentTypeModal:p==="contentType",isCreatingComponent:o==="create",isCreatingDz:o==="create",isCreatingComponentAttribute:x.createComponent||!1,isCreatingComponentInDz:x.createComponent||!1,isCreatingComponentWhileAddingAField:pt,isCreatingContentType:o==="create",isEditingAttribute:o==="edit",isDzAttribute:i==="dynamiczone",isEditingCategory:p==="editCategory",isInFirstComponentStep:b==="1",onSubmitAddComponentAttribute:Le,onSubmitAddComponentToDz:Le,onSubmitCreateComponent:Le,onSubmitCreateContentType:Le,onSubmitCreateDz:Le,onSubmitEditAttribute:Le,onSubmitEditCategory:Le,onSubmitEditComponent:Le,onSubmitEditContentType:Le,onSubmitEditCustomFieldAttribute:Le,onSubmitEditDz:Le,onClickFinish:Wd}),startActions:(0,n.jsx)(ne.$,{variant:"tertiary",onClick:Ms,children:Ce({id:"app.components.Button.cancel",defaultMessage:"Cancel"})})})]})]})},id=()=>e=>e[`${A.p}_dataManagerProvider`]||A.o,ld=()=>(0,Qn.Mz)(id(),e=>e),dd=(e,t)=>{const s=Object.keys(e).filter(r=>{const o=D(e,r,{}),l=D(t,r,{}),i=D(o,["isTemporary"],!1),d=!wt(o,l);return i||d});return(0,A.q)(s)},cd=(e,t)=>{const s=gs(D(e,"schema.attributes",[]),t),r=D(e,"isTemporary",!1)?{tmpUID:e.uid}:{uid:e.uid};return Object.assign({},r,{category:e.category},Xn(e.schema,"attributes"),{attributes:s})},ps=(e,t=!1)=>{const s=D(e,"uid",null),r=gs(D(e,"schema.attributes",[]),s),o=t?{category:D(e,"category","")}:{},l=Object.assign(o,Xn(e.schema,"attributes"),{attributes:r});return delete l.uid,delete l.isTemporary,delete l.visible,delete l.restrictRelationsTo,l},gs=(e,t)=>e.reduce((s,{name:r,...o})=>{const l=o,i=l.target===t,d=l.type==="relation",g=D(l,"targetAttribute",null);if(!i)if(d){const m=Object.assign({},l,{targetAttribute:fs(g)});s[r]=At(m)}else s[r]=At(l);if(i){const m=l.target,f=Object.assign({},l,{target:m,targetAttribute:fs(g)});s[r]=At(f)}if(l.customField){const m={...l,type:"customField"};s[r]=At(m)}return s},{}),fs=e=>e==="-"?null:e,At=e=>Object.keys(e).reduce((t,s)=>(e[s]!==null&&s!=="plugin"&&(t[s]=e[s]),t),{}),ud=(e,t,s)=>dd(e,t).map(l=>{const i=D(e,l,{});return cd(i,s)}),md=e=>rl(Object.keys(e).map(t=>({visible:e[t].schema.visible,name:t,title:e[t].schema.displayName,plugin:e[t].plugin||null,uid:t,to:`/plugins/${A.p}/content-types/${t}`,kind:e[t].schema.kind,restrictRelationsTo:e[t].schema.restrictRelationsTo})).filter(t=>t!==null),t=>ol(t.title)),hs=e=>e.reduce((t,s)=>(t[s.uid]=s,t),{}),pd=(e,t,s,r)=>{const o=t.reduce((d,g)=>{const m=D(s,g,{});return d[g]=m,d},{});return{[r?"contentType":"component"]:e,components:o}},ys=e=>Object.keys(e).reduce((t,s)=>{const r=e[s].schema;return t[s]={...e[s],schema:{...r,attributes:gd(r.attributes)}},t},{}),gd=e=>Object.keys(e).reduce((t,s)=>(t.push({...e[s],name:s}),t),[]),fd=e=>{const t=Object.keys(e).reduce((s,r)=>{const o=D(e,[r]),l=o.uid;return hd(o)&&s.push(l),s},[]);return(0,A.q)(t)},hd=e=>D(e,["schema","attributes"],[]).some(s=>{const{type:r}=s;return r==="component"}),xs=e=>{const t=Object.keys(e).reduce((s,r)=>{const o=e?.[r]?.schema?.attributes??[],l=yd(o);return[...s,...l]},[]);return(0,A.q)(t)},yd=e=>e.reduce((t,s)=>{const{type:r,component:o}=s;return r==="component"&&t.push(o),t},[]),xd=(e,t)=>{const s=Object.keys(e).map(r=>D(e,[r,...t],""));return(0,A.q)(s)},bs="did-not-kill-server",bd="server is down";function ct(e,t){return new Promise(s=>{fetch(`${window.strapi.backendURL}/_health`,{method:"HEAD",mode:"no-cors",headers:{"Content-Type":"application/json","Keep-Alive":"false"}}).then(r=>{if(r.status>=400)throw new Error(bd);if(!t)throw new Error(bs);s(e)}).catch(r=>{setTimeout(()=>ct(e,r.message!==bs).then(s),100)})})}const vd=e=>Object.values(e.attributes).filter(s=>s.type==="dynamiczone").every(s=>Array.isArray(s.components)&&s.components.length>0),Ad=({children:e})=>{const t=(0,Xe.wA)(),{components:s,contentTypes:r,isLoading:o,isLoadingForDataToBeSet:l,initialData:i,modifiedData:d,reservedNames:g}=(0,Xe.d4)(ld()),m=(0,F.hN)(),{lockAppWithAutoreload:f,unlockAppWithAutoreload:p}=(0,F.Ip)(),{setCurrentStep:T}=(0,F.Cx)(),{getPlugin:C}=(0,F.vD)(),b=C(A.p),{autoReload:M}=(0,F.Xe)(),{formatMessage:U}=(0,Y.A)(),{trackUsage:$}=(0,F.z1)(),{refetchPermissions:L}=(0,F.r5)(),{pathname:N}=(0,Fe.zy)(),{onCloseModal:k}=Je(),_=(0,Fe.W5)(`/plugins/${A.p}/content-types/:uid`),he=(0,Fe.W5)(`/plugins/${A.p}/component-categories/:categoryUid/:componentUid`),Me=(0,F.ry)(),{put:V,post:Ce,del:ee}=Me,$e=(0,u.useRef)();$e.current=U;const pe=M,le=_!==null,Ue=le?"contentType":"component",ye=le?D(_,"params.uid",null):D(he,"params.componentUid",null),J=(0,u.useRef)(),I=le?"content-types":"components";J.current=async()=>{try{const[{data:{data:x}},{data:{data:E}},{data:Z}]=await Promise.all(["components","content-types","reserved-names"].map(Ke=>Me.get(`/${A.p}/${Ke}`))),ue=hs(x),ve=ys(ue),we=hs(E),De=ys(we);t({type:A.G,components:ve,contentTypes:De,reservedNames:Z})}catch(x){console.error({err:x}),m({type:"warning",message:{id:"notification.error"}})}},(0,u.useEffect)(()=>(J.current(),()=>{t({type:A.r})}),[]),(0,u.useEffect)(()=>{!o&&ye&&jt()},[o,N,ye]),(0,u.useEffect)(()=>{M||m({type:"info",message:{id:c("notification.info.autoreaload-disable")}})},[M,m]);const Yt=(x,E,Z,ue=!1,ve,we=!1)=>{const De=ue?A.w:A.x;t({type:De,attributeToSet:x,forTarget:E,targetUid:Z,initialAttribute:ve,shouldAddComponentToData:we})},et=({attributeToSet:x,forTarget:E,targetUid:Z,initialAttribute:ue})=>{t({type:A.A,attributeToSet:x,forTarget:E,targetUid:Z,initialAttribute:ue})},ut=({attributeToSet:x,forTarget:E,targetUid:Z,initialAttribute:ue})=>{t({type:A.E,attributeToSet:x,forTarget:E,targetUid:Z,initialAttribute:ue})},tt=(x,E)=>{t({type:A.u,dynamicZoneTarget:x,componentsToAdd:E})},Kt=(x,E,Z,ue,ve=!1)=>{const we=E==="contentType"?A.y:A.z;t({type:we,data:x,componentCategory:ue,schemaType:E,uid:Z,shouldAddComponentToData:ve})},Ct=(x,E)=>{t({type:A.C,dynamicZoneTarget:x,newComponents:E})},Qt=(x,E,Z="")=>{const ue=x==="components"?A.B:A.F;x==="contentType"&&$("willDeleteFieldOfContentType"),t({type:ue,mainDataKey:x,attributeToRemoveName:E,componentUid:Z})},Xt=async x=>{try{const E=`/${A.p}/component-categories/${x}`,Z=window.confirm(U({id:c("popUpWarning.bodyMessage.category.delete")}));k(),Z&&(f?.(),await ee(E),await ct(!0),p?.(),await ge())}catch(E){console.error({err:E}),m({type:"warning",message:{id:"notification.error"}})}finally{p?.()}},Jt=async()=>{try{const x=`/${A.p}/${I}/${ye}`,E=D(d,[Ue,"isTemporary"],!1),Z=window.confirm(U({id:c(`popUpWarning.bodyMessage.${le?"contentType":"component"}.delete`)}));if(k(),Z){if(E){t({type:A.D});return}f?.(),await ee(x),await ct(!0),await p?.(),await ge()}}catch(x){console.error({err:x}),m({type:"warning",message:{id:"notification.error"}})}finally{p?.()}},be=async(x,E)=>{try{const Z=`/${A.p}/component-categories/${x}`;k(),f?.(),await V(Z,E),await ct(!0),await p?.(),await ge()}catch(Z){console.error({err:Z}),m({type:"warning",message:{id:"notification.error"}})}finally{p?.()}},qt=()=>{const x=Object.assign({},s,d.components);if(!le){const Z=D(d,"component",{});Gn(x,D(Z,["uid"],""),Z)}const E=fd(x);return(0,A.q)(E)},_t=()=>{const x=xs(s),E=xs(d.components||{});return(0,A.q)([...E,...x])},en=(x,E)=>{t({type:A.v,dzName:x,componentToRemoveIndex:E})},jt=()=>{const E=D(le?r:s,ye??"",{schema:{attributes:[]}}),Z=(0,A.s)(E.schema.attributes,s),ue=pd(E,Z,s,le),ve=D(E,"isTemporary",!1)&&el(D(E,"schema.attributes",[]))===0;t({type:A.t,schemaToSet:ue,hasJustCreatedSchema:ve})},Ye=(0,u.useMemo)(()=>{const x=le?r:s;return ye==="create-content-type"?!1:!Object.keys(x).includes(ye||"")&&!o},[s,r,ye,le,o]),mt=(0,u.useMemo)(()=>{const x=Object.keys(r).filter(E=>D(r,[E,"schema","visible"],!0)).sort();return D(x,"0","create-content-type")},[r]);if(Ye)return(0,n.jsx)(Fe.rd,{to:`/plugins/${A.p}/content-types/${mt}`});const Ve=async x=>{try{const E=D(d,[Ue,"isTemporary"],!1),Z={components:ud(d.components,s,ye)};if(le){const De=(b?.apis?.forms).mutateContentTypeSchema({...ps(d.contentType),...x},i.contentType);if(!vd(De)){m({type:"warning",message:{id:c("notification.error.dynamiczone-min.validation"),defaultMessage:"At least one component is required in a dynamic zone to be able to save a content type"}});return}Z.contentType=De,$("willSaveContentType")}else Z.component=ps(d.component,!0),$("willSaveComponent");f?.();const ue=`/${A.p}/${I}`,ve=E?ue:`${ue}/${ye}`;if(E?await Ce(ve,Z):await V(ve,Z),await ct(!0),await p?.(),E&&(i.contentType?.schema.kind==="collectionType"||i.contentType?.schema.kind==="singleType")&&T("contentTypeBuilder.success"),le){$("didSaveContentType");const we=D(Z,["contentType","schema","name"],""),De=D(i,["contentType","schema","name"],"");!E&&we!==De&&$("didEditNameOfContentType")}else $("didSaveComponent");await ge()}catch(E){le||$("didNotSaveComponent"),console.error({err:E.response}),m({type:"warning",message:{id:"notification.error"}})}finally{p?.()}},ge=async()=>{await L()},pt=(x,E,Z)=>{t({type:A.U,data:x,schemaType:E,uid:Z})};return(0,n.jsx)(Jn.Provider,{value:{addAttribute:Yt,addCustomFieldAttribute:et,addCreatedComponentToDynamicZone:tt,allComponentsCategories:xd(s,["category"]),changeDynamicZoneComponents:Ct,components:s,componentsGroupedByCategory:_i(s,"category"),componentsThatHaveOtherComponentInTheirAttributes:qt(),contentTypes:r,createSchema:Kt,deleteCategory:Xt,deleteData:Jt,editCategory:be,editCustomFieldAttribute:ut,isInDevelopmentMode:pe,initialData:i,isInContentTypeView:le,modifiedData:d,nestedComponents:_t(),removeAttribute:Qt,removeComponentFromDynamicZone:en,reservedNames:g,setModifiedData:jt,sortedContentTypesList:md(r),submitData:Ve,updateSchema:pt},children:l?(0,n.jsx)(F.Bl,{}):(0,n.jsxs)(n.Fragment,{children:[e,pe&&(0,n.jsx)(rd,{})]})})},Cd=(0,u.memo)(Ad),vs={actionType:null,attributeName:null,attributeType:null,categoryName:null,dynamicZoneTarget:null,forTarget:null,modalType:null,isOpen:!1,showBackLink:!1,kind:null,step:null,targetUid:null,customFieldUid:null},jd=({children:e})=>{const[t,s]=u.useState(vs),{trackUsage:r}=(0,F.z1)(),o=({attributeType:$,customFieldUid:L})=>{s(N=>({...N,actionType:"create",modalType:"customField",attributeType:$,customFieldUid:L}))},l=({attributeType:$,step:L})=>{t.forTarget==="contentType"&&r("didSelectContentTypeFieldType",{type:$}),s(N=>({...N,actionType:"create",modalType:"attribute",step:L,attributeType:$,showBackLink:!0}))},i=({dynamicZoneTarget:$,targetUid:L})=>{s(N=>({...N,dynamicZoneTarget:$,targetUid:L,modalType:"addComponentToDynamicZone",forTarget:"contentType",step:"1",actionType:"edit",isOpen:!0}))},d=({forTarget:$,targetUid:L})=>{s(N=>({...N,actionType:"create",forTarget:$,targetUid:L,modalType:"chooseAttribute",isOpen:!0,showBackLink:!1}))},g=$=>{s(L=>({...L,...$,isOpen:!0}))},m=$=>{s(L=>({...L,categoryName:$,actionType:"edit",modalType:"editCategory",isOpen:!0}))},f=({forTarget:$,targetUid:L,attributeName:N,attributeType:k,customFieldUid:_})=>{s(he=>({...he,modalType:"customField",customFieldUid:_,actionType:"edit",forTarget:$,targetUid:L,attributeName:N,attributeType:k,isOpen:!0}))},p=({forTarget:$,targetUid:L,attributeName:N,attributeType:k,step:_})=>{s(he=>({...he,modalType:"attribute",actionType:"edit",forTarget:$,targetUid:L,attributeName:N,attributeType:k,step:_,isOpen:!0}))},T=({modalType:$,forTarget:L,targetUid:N,kind:k})=>{s(_=>({..._,modalType:$,actionType:"edit",forTarget:L,targetUid:N,kind:k,isOpen:!0}))},C=()=>{s(vs)},b=({forTarget:$,targetUid:L})=>{s(N=>({...N,forTarget:$,targetUid:L,modalType:"chooseAttribute"}))},M=()=>{s($=>({...$,attributeType:"component",modalType:"attribute",step:"2"}))},U=({dynamicZoneTarget:$})=>{s(L=>({...L,dynamicZoneTarget:$,modalType:"addComponentToDynamicZone",actionType:"create",step:"1",attributeType:null,attributeName:null}))};return(0,n.jsx)(qn.Provider,{value:{...t,onClickSelectField:l,onClickSelectCustomField:o,onCloseModal:C,onNavigateToChooseAttributeModal:b,onNavigateToAddCompoToDZModal:U,onOpenModalAddComponentsToDZ:i,onNavigateToCreateComponentStep2:M,onOpenModalAddField:d,onOpenModalCreateSchema:g,onOpenModalEditCategory:m,onOpenModalEditField:p,onOpenModalEditCustomField:f,onOpenModalEditSchema:T,setFormModalNavigationState:s},children:e})},Td=(0,u.lazy)(()=>a.e(4622).then(a.bind(a,22241))),Md=()=>{const{url:e}=(0,Fe.W5)();return(0,n.jsx)(u.Suspense,{fallback:(0,n.jsx)(F.Bl,{}),children:(0,n.jsx)(Fe.dO,{children:(0,n.jsx)(Fe.qh,{path:`${e}/:componentUid`,children:(0,n.jsx)(Td,{})})})})},As=(0,u.lazy)(()=>a.e(4622).then(a.bind(a,22241))),$d=Object.freeze(Object.defineProperty({__proto__:null,default:()=>{const{formatMessage:e}=(0,Y.A)(),t=e({id:`${A.p}.plugin.name`,defaultMessage:"Content Types Builder"}),{startSection:s}=(0,F.Cx)(),r=(0,u.useRef)(s);return(0,u.useEffect)(()=>{r.current&&r.current("contentTypeBuilder")},[]),(0,n.jsxs)(F.kz,{permissions:A.P.main,children:[(0,n.jsx)(zs.m,{title:t}),(0,n.jsx)(jd,{children:(0,n.jsx)(Cd,{children:(0,n.jsx)(Ws.P,{sideNav:(0,n.jsx)(ll,{}),children:(0,n.jsx)(u.Suspense,{fallback:(0,n.jsx)(F.Bl,{}),children:(0,n.jsxs)(Fe.dO,{children:[(0,n.jsx)(Fe.qh,{path:`/plugins/${A.p}/content-types/create-content-type`,component:As}),(0,n.jsx)(Fe.qh,{path:`/plugins/${A.p}/content-types/:uid`,component:As}),(0,n.jsx)(Fe.qh,{path:`/plugins/${A.p}/component-categories/:categoryUid`,component:Md})]})})})})})]})}},Symbol.toStringTag,{value:"Module"}))},71387:W=>{var G="\\ud800-\\udfff",a="\\u0300-\\u036f",n="\\ufe20-\\ufe2f",u="\\u20d0-\\u20ff",h=a+n+u,P="\\ufe0e\\ufe0f",O="["+G+"]",B="["+h+"]",v="\\ud83c[\\udffb-\\udfff]",S="(?:"+B+"|"+v+")",z="[^"+G+"]",q="(?:\\ud83c[\\udde6-\\uddff]){2}",te="[\\ud800-\\udbff][\\udc00-\\udfff]",oe="\\u200d",ke=S+"?",me="["+P+"]?",de="(?:"+oe+"(?:"+[z,q,te].join("|")+")"+me+ke+")*",se=me+ke+de,re="(?:"+[z+B+"?",B,q,te,O].join("|")+")",ae=RegExp(v+"(?="+v+")|"+re+se,"g");function Ie(Re){for(var xe=ae.lastIndex=0;ae.test(Re);)++xe;return xe}W.exports=Ie},71547:(W,G,a)=>{var n=a(19913);function u(h){return h&&h.length?n(h):[]}W.exports=u},74565:W=>{function G(a,n){var u=a.length;for(a.sort(n);u--;)a[u]=a[u].value;return a}W.exports=G},75821:(W,G,a)=>{var n=a(91522);function u(h,P){return function(O,B){if(O==null)return O;if(!n(O))return h(O,B);for(var v=O.length,S=P?v:-1,z=Object(O);(P?S--:++S<v)&&B(z[S],S,z)!==!1;);return O}}W.exports=u},80846:(W,G,a)=>{"use strict";a.d(G,{B:()=>P});var n=a(92132),u=a(94929),h=a(5391);const P=({options:B,...v})=>(0,n.jsx)(h.KF,{...v,children:B.map(S=>"children"in S?(0,n.jsx)(h.np,{label:S.label,values:S.children.map(z=>z.value.toString()),children:S.children.map(z=>(0,n.jsx)(O,{value:z.value,children:z.label},z.value))},S.label):(0,n.jsx)(h.fe,{value:S.value,children:S.label},S.value))}),O=(0,u.Ay)(h.fe)`
  padding-left: ${({theme:B})=>B.spaces[7]};
`},88532:(W,G,a)=>{var n=a(94445),u=a(7233),h=a(45353),P=a(82261);function O(B,v){return function(S,z){var q=P(S)?n:u,te=v?v():{};return q(S,B,h(z,2),te)}}W.exports=O},89102:(W,G,a)=>{var n=a(85306);function u(h){return n(h).toLowerCase()}W.exports=u},94445:W=>{function G(a,n,u,h){for(var P=-1,O=a==null?0:a.length;++P<O;){var B=a[P];n(h,B,u(B),a)}return h}W.exports=G},94710:(W,G,a)=>{var n=a(95292),u=a(88532),h=Object.prototype,P=h.hasOwnProperty,O=u(function(B,v,S){P.call(B,S)?B[S].push(v):n(B,S,[v])});W.exports=O},97449:(W,G,a)=>{var n=a(85373),u=a(75821),h=u(n);W.exports=h}}]);
