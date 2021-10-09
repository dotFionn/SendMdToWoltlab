const l = console.log.bind(console, '-→');

const cwd = process.cwd();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql');

const dayjs = require('dayjs');
const dayjs_utc = require('dayjs/plugin/utc');
const dayjs_timezone = require('dayjs/plugin/timezone');

dayjs.extend(dayjs_utc);
dayjs.extend(dayjs_timezone);

const {
  INPUT_DBHOST,
  INPUT_DBPORT,
  INPUT_DBUSER,
  INPUT_DBPASS,
  INPUT_DBNAME,
  INPUT_WBBTABLEID,
  INPUT_STAGINGBRANCH,
  INPUT_STAGINGPATH,
  INPUT_DATEFORMAT,
  INPUT_TIMEZONE,
} = process.env;

const md = require('markdown-it')({
  html: true, // Enable HTML tags in source
  xhtmlOut: true, // Use '/' to close single tags (<br />).
  // This is only for full CommonMark compatibility.
  breaks: true, // Convert '\n' in paragraphs into <br>
  langPrefix: 'language-', // CSS language prefix for fenced blocks. Can be
  // useful for external highlighters.
  linkify: false, // Autoconvert URL-like text to links

  // Enable some language-neutral replacement + quotes beautification
  // For the full list of replacements, see https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js
  typographer: true,

  // Double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: '„“‚‘',
});

const contentDir = path.join(cwd, 'content');

l(`working in ${cwd}...`);

function readDir(dir) {
  l(`reading directory ${dir}...`);

  const entries = fs.readdirSync(dir);

  const files = [];

  entries.forEach((entry) => {
    const entryPath = path.join(dir, entry);

    const entryInfo = fs.lstatSync(entryPath);

    if (['.git', '.github'].includes(entry)) {
      return;
    }

    if (entryInfo.isDirectory()) {
      files.push(...readDir(entryPath));
    } else {
      l(`found file ${entry}`);
      files.push(entryPath);
    }
  });

  l(`done reading directory ${dir}...`);
  return files;
}

const frameFileContent = fs.readFileSync(path.join(cwd, 'meta', 'frame.html')).toString();

function createFrame(content) {
  return frameFileContent.replace('{{content}}', content);
}

function setChangedTimestamp(content) {
  return content.replace('{{changeddate}}', dayjs().tz(INPUT_TIMEZONE).format(INPUT_DATEFORMAT));
}

const allFiles = readDir(contentDir);

const mdFiles = allFiles.filter((file) => ['.md'].includes(path.extname(file)));

const pagesNotFound = [];

const dbPrefix = (table) => `${table}${INPUT_WBBTABLEID}`;

const db = mysql.createConnection({
  host: INPUT_DBHOST,
  port: INPUT_DBPORT,
  user: INPUT_DBUSER,
  password: INPUT_DBPASS,
  database: INPUT_DBNAME,
});

function query(queryStr, prep) {
  console.log('MySQL Query:', queryStr, JSON.stringify(prep));

  return new Promise((resolve, reject) => {
    if (!queryStr) {
      l('Trying to query database without giving query');
      return reject({ error: { code: 'EQUERYNOTFOUND' }, result: [] });
    }

    db.query(queryStr, prep, (err, result) => {
      if (err) {
        console.log('MySQL Error:', err);
        return reject(err);
      }
      resolve(result);
    });
  });
}

async function checkIfPageExists(url) {
  let res;
  try {
    res = await query(`SELECT title FROM ${dbPrefix('wcf')}_page_content WHERE customURL = ?`, [url]);
  } catch (e) {
    console.log(e);
    return false;
  }
  return res.length > 0;
}

function writePage(url, title, content) {
  return new Promise((resolve, reject) => {
    query(`UPDATE ${dbPrefix('wcf')}_page_content SET title = '${title}', content = '${content}' WHERE customURL = '${url}'`, []).then(
      (...params) => {
        resolve(...params);
        console.log(params);
      },
      (...params) => {
        reject(...params);
        console.log(params);
      }
    );
  });
}

async function doWork(url, title, content) {
  url = `${process.env.BRANCH == INPUT_STAGINGBRANCH ? INPUT_STAGINGPATH : ''}${url}`;

  console.log('checking if file exists:', url);

  const pageExists = await checkIfPageExists(url);
  console.log('done checking if file exists:', url);

  if (pageExists) {
    console.log('file exists:', url);
    try {
      writePage(url, title, content);
    } catch (e) {
      console.log(e);
    }
  } else {
    console.log('file does not exist:', url);
    pagesNotFound.push(url);
  }
}

const work = [];

mdFiles.forEach((file) => {
  l(`working on file ${file}...`);

  const mdFromFile = fs.readFileSync(file).toString();
  const renderedHtml = md.render(mdFromFile);

  const renderedSplit = renderedHtml.split('\n');
  const headLineHtml = renderedSplit.splice(0, 1)[0];
  const regexRes = /<h1>(.*)<\/h1>/gi.exec(headLineHtml);
  const headline = regexRes[1];

  const webPath = file.replace(contentDir, '').replace('.md', '').replace(/\\/gi, '/').replace('/README', '');
  const text = createFrame(setChangedTimestamp(renderedSplit.join('\n')));

  console.log(JSON.stringify({ webPath, headline }, undefined, 2));

  console.log('::group::HTML Content');
  console.log(text);
  console.log('::endgroup::');

  // workPromises.push(doWork());

  work.push({ webPath, headline, text });
});

(async () => {
  for (let i = 0; i < work.length; i++) {
    await doWork(work[i].webPath, work[i].headline, work[i].text);
  }

  console.log('::group::Pages not found');
  pagesNotFound.forEach((page) => console.log('-', page));
  console.log('::endgroup::');

  process.exit(pagesNotFound.length);
})();
