document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // When compose form is submitted, run the 'send_email' JS function
  document.querySelector('#compose-view').addEventListener('submit', send_email);
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#details-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
    console.log(`Email id: ${id}`)

    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
        console.log(email);

        // Show details view but hide other views
        document.querySelector('#details-view').style.display = 'block';
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';

        // Detail view HTML
        document.querySelector('#details-view').innerHTML = `
        <ul class="list-group list-group-flush">
          <li class="list-group-item"><strong>From: </strong> ${email.sender}</li>
          <li class="list-group-item"><strong>To: </strong> ${email.recipients}</li>
          <li class="list-group-item"><strong>Subject: </strong> ${email.subject}</li>
          <li class="list-group-item"><strong>Sent on: </strong> ${email.timestamp}</li>
        </ul>

        <br>
        <div style="font-size: 20px;">${email.body}</div>
        <br>
         `

        // Change opened status
        if (!email.read){
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  read: true
              })
            })
        }

        // Change archived status
        const archive_button = document.createElement('button');

        if (email.archived === true){
            console.log('Email is archived:', email.archived);
            archive_button.className = "btn btn-outline-primary"
        }
        else{
            console.log('Email is not archived:', email.archived);
            archive_button.className = "btn btn-outline-danger"
        }

        archive_button.innerHTML = email.archived ? "Unarchive" : "Archive";

        archive_button.addEventListener('click', function() {
            console.log('Archive button clicked')
            fetch(`/emails/${email.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: !email.archived
              })
            })
            .then(() => {load_mailbox('archive')})
        });
        document.querySelector('#details-view').append(archive_button);

        // Inserting a space between buttons
        const space = document.createElement('div');
        space.style.marginTop = "10px"; // Adjust margin for desired spacing
        document.querySelector('#details-view').append(space);

        // Reply button
        const reply_button = document.createElement('button');
        reply_button.className = "btn btn-outline-primary";
        reply_button.innerHTML = "Reply"

        if (!email.archived) {
            reply_button.addEventListener('click', function(){
                console.log('Reply button clicked')
                // Load email form but fill in some fields
                compose_email()
                document.querySelector('#compose-recipients').value = email.sender;
                document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n ${email.body}`;

                // Check if email subject already has 'Re:' so it doesn't append more 'Re:'s
                let subject = email.subject;
                if(subject.split(' ',1)[0] != "Re:"){
                    subject = "Re: " + email.subject
                }

                document.querySelector('#compose-subject').value = subject;
            });
            document.querySelector('#details-view').append(reply_button);
        }
    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#details-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Getting user's emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);

    // Create card for each email
    emails.forEach(individualEmail => {

        // Creating cards for each email in inbox & changing colour when read is T/F
        const newEmail = document.createElement('div');
        newEmail.className = "list-group-item";
        newEmail.innerHTML = `
            <h5>${individualEmail.subject}</h5>
            <h6>From: ${individualEmail.sender}</h6>
            <h7>Sent on ${individualEmail.timestamp}</h7>
            <br>
        `;

        // If opened change colour
        if (individualEmail.read === true){
            console.log('Email is read:', individualEmail.read);
            newEmail.className = "list-group-item list-group-item-dark"
        }
        else{
            console.log('Email is unread:', individualEmail.read);
            newEmail.className = "list-group-item"
        }

        newEmail.addEventListener('click', function() {
            console.log('This element has been clicked!');
            view_email(individualEmail.id)
        });
        document.querySelector('#emails-view').append(newEmail);
    })


  });
}

function send_email(){
    // Prevent fast reloading
    event.preventDefault();

    // Make post request to gather sent email details

    // Gather email details
    const recipients = document.querySelector('#compose-recipients').value;
    const subject = document.querySelector('#compose-subject').value;
    const message = document.querySelector('#compose-body').value;

    // Send email data to email function
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: recipients,
          subject: subject,
          body: message
      })
    })

    .then(response => response.json())
    .then(result => {
        console.log(result);
        load_mailbox('sent');
    });
}