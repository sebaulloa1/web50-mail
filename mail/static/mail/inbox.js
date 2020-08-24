document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
  
  const user_email = document.querySelector('#user_email');

  
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('.alert').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        document.querySelector('.alert-danger').style.display = 'block';
        document.querySelector('.alert-danger').innerHTML = result.error;
        window.location.hash = '#alert';
        setTimeout(function() {
          document.querySelector('.alert-danger').style.display = 'none';
        }, 4000);
        return false;
      } else {
        document.querySelector('.alert-success').style.display = 'block';
        document.querySelector('.alert-success').innerHTML = result.message;
        window.location.hash = '#alert';
        setTimeout(function() {
          document.querySelector('.alert-success').style.display = 'none';
        }, 4000);
        load_mailbox('inbox');
      }
    });
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';
  //document.querySelector('#alert').style.display = 'none';
  
  document.querySelector('#emails-view').innerHTML = '';

  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Fetch to the back end
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Iterate over every email
      console.log(emails)
      if (emails.length === 0) {
        document.querySelector('#emails-view').innerHTML += `Your inbox is empty`;
      } else {
        for (email of emails) {
          let email_div = document.createElement('div'); // Create a div for each email
        
          if (mailbox === 'inbox'){  // Condition for inbox 
            email_div.innerHTML = `
              <div style="font-weight:bold;width:25%;float:left;">${email.sender}</div> <div style="float:left;width:30%;">${email.subject}</div> <div style="float:right;width:30%;text-align:right;color:gray;">${email.timestamp}</div>
                `;
            if (email.read) {
              email_div.style.background = '#cccccc';
            }
          } else if (mailbox === 'sent') {
            email_div.innerHTML = `
              <div style="font-weight:bold;width:25%;float:left;">${email.recipients}</div> <div style="float:left;width:30%;">${email.subject}</div> <div style="float:right;width:30%;text-align:right;color:gray;">${email.timestamp}</div>
                `;
          } else if (mailbox === 'archive') {
            email_div.innerHTML = `
              <div style="font-weight:bold;width:25%;float:left;">${email.sender}</div> <div style="float:left;width:30%;">${email.subject}</div> <div style="float:right;width:30%;text-align:right;color:gray;">${email.timestamp}</div>
                `;
          }
          email_div.id = email.id
          email_div.className = 'email-div'; // Add css class

          document.querySelector('#emails-view').appendChild(email_div); // Add the div to the container
        }
      }
      document.querySelectorAll('.email-div').forEach(email => {
        email.addEventListener('click', function() {
          view_email(email.id)
        })
      });
  })
}

function view_email(code) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'block';
  document.querySelector('#alert').style.display = 'none';

  document.querySelector('#email-details').innerHTML = '';

  // Change the read status
  fetch(`/emails/${code}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })

  // Fetch for email details
  fetch(`/emails/${code}`)
  .then(response => response.json())
  .then(email => {
    let details = document.createElement('div'); // Create a new detail div
    if (email.sender !== user_email.innerHTML) {
      details.innerHTML = `
        <div><b>From: </b>${email.sender}</div>
        <div><b>To: </b>${email.recipients}</div>
        <div><b>Subject: </b>${email.subject}</div>
        <div><b>Timestamp: </b>${email.timestamp}</div>
        <button onclick="reply(${code})" class="btn btn-sm btn-outline-primary">Reply</button>
        ${email.archived === false 
          ? `<div style="margin-bottom:0;" onclick="archive(${code}, false)" id="archive" class="btn btn-sm btn-outline-primary">Archive</div>`
          : `<div style="margin-bottom:0;" onclick="archive(${code}, true)" id="archive" class="active btn btn-sm btn-outline-primary">Archived</div>`
        }
        <hr>
        <div>${email.body}</div>
        `;
    } else {
      details.innerHTML = `
        <div><b>From: </b>${email.sender}</div>
        <div><b>To: </b>${email.recipients}</div>
        <div><b>Subject: </b>${email.subject}</div>
        <div><b>Timestamp: </b>${email.timestamp}</div>
        <button onclick="reply(${code})" class="btn btn-sm btn-outline-primary">Reply</button>
        <hr>
        <div>${email.body}</div>
        `;
    }
    
    document.querySelector('#email-details').append(details); // Add the details to the DOM
  })

}

function archive(code, status) {
  if (status === true) {
    fetch(`/emails/${code}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: false
      })
    })
    .then(() => {
      document.querySelector('.alert-success').style.display = 'block';
      document.querySelector('.alert-success').innerHTML = 'Email removed from your Archive';
      window.location.hash = '#alert';
      setTimeout(function() {
        document.querySelector('.alert-success').style.display = 'none';
      }, 4000);
      load_mailbox('inbox');
    })
  } else {
    fetch(`/emails/${code}`, {
      method: 'PUT',
      body: JSON.stringify({
        archived: true
      })
    })
    .then(() => {
      document.querySelector('.alert-success').style.display = 'block';
      document.querySelector('.alert-success').innerHTML = 'Email Archived';
      window.location.hash = '#alert';
      setTimeout(function() {
        document.querySelector('.alert-success').style.display = 'none';
      }, 4000);
      load_mailbox('inbox');
    })
  }
}

function reply(code) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#alert').style.display = 'none';

  // Get the email info
  fetch(`/emails/${code}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    document.querySelector('#compose-body').innerHTML = `"On ${email.timestamp} ${email.sender} wrote:"${email.body}"
       `;
  })

  // Catch send
  document.querySelector('#compose-form').onsubmit = () => {
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.error) {
        document.querySelector('.alert-danger').style.display = 'block';
        document.querySelector('.alert-danger').innerHTML = result.error;
        window.location.hash = '#alert';
        setTimeout(function() {
          document.querySelector('.alert-danger').style.display = 'none';
        }, 4000);
        return false;
      } else {
        document.querySelector('.alert-success').style.display = 'block';
        document.querySelector('.alert-success').innerHTML = result.message;
        window.location.hash = '#alert';
        setTimeout(function() {
          document.querySelector('.alert-success').style.display = 'none';
        }, 4000);
        load_mailbox('inbox');
      }
    });
    return false;
  }
}

