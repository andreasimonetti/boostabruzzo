const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const CSV = require('csv-string');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('boostabruzzo-5924e1a3960b.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content), loadMentors);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  const drive = google.drive({version: 'v3', auth});
  drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const files = res.data.files;
    if (files.length) {
      console.log('Files:');
      files.map((file) => {
        console.log(`${file.name} (${file.id})`);
      });
    } else {
      console.log('No files found.');
    }
  });
}

const stream = require('stream');

function loadMentors(auth) {
	const drive = google.drive({version: 'v3', auth});
	var dest = fs.createWriteStream('/tmp/resume.csv');
	drive.files.export({
	  fileId: "1oGQuaO0ZYjnEK7NAz9364znkmYofGRQZ0IR5gR-etsc",
	 	mimeType: 'text/csv'
	}).then((res) => {
		const mentors = CSV.parse(res.data, ",").slice(1);
    // 1 -> email, 2 nome, 3 cognome, 5nazione, 8 titolo, 21linkedin
    mentors.map((mentor) => {
      // console.log(mentor);
      // console.log(mentor[1], mentor[2], mentor[3], mentor[5], mentor[8], mentor[21]);
      console.log(`<div class="col-sm-6 col-lg-4">
                <div class="card-wrap">
                    <div class="content-wrap">
                        <h5 class="mbr-section-title card-title mbr-fonts-style align-center m-0 display-2">
                            <strong>${mentor[2]} ${mentor[3]}</strong>
                        </h5>
                        <h6 class="mbr-role mbr-fonts-style align-center mb-3 display-5">
                            <strong>${mentor[8]}</strong>
                        </h6>
                        <!--p class="card-text mbr-fonts-style align-center display-7">
                            ${mentor[20]}
                        </p-->
                        <div class="social-row display-7">
                            <div class="soc-item">
                                <a href="${mentor[21]}" target="_blank">
                                    <span class="mbr-iconfont socicon-linkedin socicon"></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);
    });
    // console.log(mentors);
	});
}