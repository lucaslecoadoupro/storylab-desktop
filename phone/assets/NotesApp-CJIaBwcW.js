import{r as l,j as e,o as d}from"./index-DbxlH5TS.js";import{A as n}from"./AppScreen-B0gZystC.js";const o=[{id:1,title:"Liste courses",date:"Hier",body:`Pâtes
Jus d’orange
Cahier grand format
Piles pour la calculette`},{id:2,title:"Idées exposé",date:"Lundi",body:`Thème : les réseaux sociaux
– Qui voit mes photos ?
– Qu’est-ce qu’une donnée personnelle ?
– Exemples concrets`},{id:3,title:"Codes casier",date:"12/09",body:"Casier gym : demander au prof"}];function p(){const[i,a]=l.useState(null),t=o.find(s=>s.id===i);return t?e.jsx(n,{title:"",onBack:()=>a(null),backLabel:"Notes",children:e.jsxs("article",{className:"note",children:[e.jsx("p",{className:"note-date",children:t.date}),e.jsx("h2",{className:"note-title",children:t.title}),e.jsx("p",{className:"note-body",children:t.body})]})}):e.jsx(n,{title:"Notes",large:!0,actions:e.jsx(d,{}),children:e.jsx("div",{className:"notes-list",children:o.map(s=>e.jsxs("button",{className:"note-card",onClick:()=>a(s.id),children:[e.jsx("span",{className:"note-card-title",children:s.title}),e.jsxs("span",{className:"note-card-meta",children:[e.jsx("span",{children:s.date})," ",s.body.split(`
`)[0]]})]},s.id))})})}export{p as default};
