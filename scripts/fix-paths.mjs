import fs from 'fs';
import path from 'path';

// Fix index.html
const indexHtmlPath = 'index.html';
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
indexHtml = indexHtml.replace(/"\/framerusercontent\.com/g, '"./framerusercontent.com');
indexHtml = indexHtml.replace(/"\/admin\//g, '"./admin/');
fs.writeFileSync(indexHtmlPath, indexHtml);

// Fix admin/index.html
const adminIndexPath = path.join('admin', 'index.html');
let adminIndex = fs.readFileSync(adminIndexPath, 'utf8');
adminIndex = adminIndex.replace(/"\/admin\//g, '"./');
fs.writeFileSync(adminIndexPath, adminIndex);

// Fix admin/app.js
const adminAppPath = path.join('admin', 'app.js');
let adminApp = fs.readFileSync(adminAppPath, 'utf8');
adminApp = adminApp.replace(/"\/admin\/data\/cases\.json"/g, '"./data/cases.json"');
fs.writeFileSync(adminAppPath, adminApp);

console.log('Caminhos corrigidos com sucesso!');
