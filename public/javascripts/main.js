//globals
var pusher;
var nettuts_channel;
var has_chat = false;

Pusher.log = function(msg) {
    console.log(msg);
};

$('#chat_widget_login_button').click(function() {
    $(this).hide(); //hide the login button
    $('#chat_widget_login_loader').show(); //show the loader gif
    username = $('#chat_widget_username').val(); //get the username
    username = username.replace(/[^a-z0-9]/gi, ''); //filter it
    if( username == '' ) { //if blank, then alert the user
        alert('Please provide a valid username (alphanumeric only)');
    } else { //else, login our user via start_session.php
        ajaxCall('/api/start_session', {
            username: username
        }, function() {
            //We're logged in! Now what?
            pusher = new Pusher('d6c48a6ad315df30372b', {
                 authEndpoint: '/api/pusher_auth'
            });
            Pusher.channel_auth_endpoint = '/api/pusher_auth';
            nettuts_channel = pusher.subscribe('presence-nettuts'); //join the presence-nettuts channel
             
            pusher.connection.bind('connected', function() { //bind a function after we've connected to Pusher
                $('#chat_widget_login_loader').hide(); //hide the loading gif
                $('#chat_widget_login_button').show(); //show the login button again
                 
                $('#chat_widget_login').hide(); //hide the login screen
                $('#chat_widget_main_container').show(); //show the chat screen
                 
                //here, we bind to the pusher:subscription_succeeded event, which is called whenever you
                //successfully subscribe to a channel
                nettuts_channel.bind('pusher:subscription_succeeded', function(members) {
                    //this makes a list of all the online clients and sets the online list html
                    //it also updates the online count
                    var whosonline_html = '';
                    members.each(function(member) {
                        whosonline_html += '<li class="chat_widget_member" id="chat_widget_member_' + 
                        member.id + '">' + member.info.name + '</li>';
                    });
                    $('#chat_widget_online_list').html(whosonline_html);
                    updateOnlineCount();
                });
                 
                //here we bind to the pusher:member_added event, which tells us whenever someone else
                //successfully subscribes to the channel
                nettuts_channel.bind('pusher:member_added', function(member) {
                    //this appends the new connected client's name to the online list
                    //and updates the online count as well
                    $('#chat_widget_online_list').append('<li class="chat_widget_member" ' +
                    'id="chat_widget_member_' + member.id + '">' + member.info.name + '</li>');
                    updateOnlineCount();
                });
                 
                //here, we bind to pusher:member_removed event, which tells us whenever someone
                //unsubscribes or disconnects from the channel
                nettuts_channel.bind('pusher:member_removed', function(member) {
                    //this removes the client from the online list and updates the online count
                    $('#chat_widget_member_' + member.id).remove();
                    updateOnlineCount();
                });

                nettuts_channel.bind('new_message', function(data) {
                    newMessageCallback(data);
                });
            });
        });
    }
});

$('#chat_widget_form').submit(function() {
  var chat_widget_input = $('#chat_widget_input'),
        chat_widget_button = $('#chat_widget_button'),
        chat_widget_loader = $('#chat_widget_loader'),
        message = chat_widget_input.val(); //get the value from the text input
     
    chat_widget_button.hide(); //hide the chat button
    chat_widget_loader.show(); //show the chat loader gif
 
    ajaxCall('api/send_message', {
        message: message
    }, function(msg) { 
        //make an ajax call to send_message.php
        chat_widget_input.val(''); //clear the text input
        chat_widget_loader.hide(); //hide the loader gif
        chat_widget_button.show(); //show the chat button
 
        // newMessageCallback(msg.data); //display the message with the newMessageCallback function
    });
 
    return false;
});

function ajaxCall(ajax_url, ajax_data, successCallback) {
    $.ajax({
        type : "POST",
        url : ajax_url,
        dataType : "json",
        data: ajax_data,
        time : 10,
        success : function(msg) {
            if( msg.success ) {
                successCallback(msg);
            } else {
                alert(msg.errormsg);
            }
        },
        error: function(msg) {
        }
    });
}

function updateOnlineCount() {
    $('#chat_widget_counter').html($('.chat_widget_member').length);
}

function newMessageCallback(data) {
    if( has_chat == false ) { //if the user doesn't have chat messages in the div yet
        $('#chat_widget_messages').html(''); //remove the contents i.e. 'chat messages go here'
        has_chat = true; //and set it so it won't go inside this if-statement again
    }
     
    $('#chat_widget_messages').append('[<strong>' + data.username + '</strong>] ' + data.message + '<br />');
}
