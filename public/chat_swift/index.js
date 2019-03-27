$(function() {
  // Get handle to the chat div
  var $chatWindow = $('#messages');

  // Our interface to the Chat service
  var chatClient;

  // A handle to the "Javascript" chat channel - the one and only channel we
  // will have in this sample app
  var swiftChannel;

  // The server will assign the client a random username - store that value
  // here
  var username;

  // Helper function to print info messages to the chat window
  function print(infoMessage, asHtml) {
    var $msg = $('<div class="info">');
    if (asHtml) {
      $msg.html(infoMessage);
    } else {
      $msg.text(infoMessage);
    }
    $chatWindow.append($msg);
  }

  // Helper function to print chat message to the chat window
  function printMessage(fromUser, message) {
    var $user = $('<span class="username">').text(fromUser + ':');
    if (fromUser === username) {
      $user.addClass('me');
    }
    var $message = $('<span class="message">').text(message);
    var $container = $('<div class="message-container">');
    $container.append($user).append($message);
    $chatWindow.append($container);
    $chatWindow.scrollTop($chatWindow[0].scrollHeight);
  }

  // Alert the user they have been assigned a random username
  print('Logging in...');

  // Get an access token for the current user, passing a username (identity)
  // and a device ID - for browser-based apps, we'll always just use the
  // value "browser"
  $.getJSON('/token', {
    device: 'browser'
  }, function(data) {
    // Alert the user they have been assigned a random username
    username = data.identity;
    print('You have been assigned a random username of: '
    + '<span class="me">' + username + '</span>', true);

    // Initialize the Chat client
    Twilio.Chat.Client.create(data.token).then(client => {
      chatClient = client;
      chatClient.getSubscribedChannels().then(createOrJoinSwiftChannel);
    });
  });

  // Channel #2

  function createOrJoinSwiftChannel() {
    // Get the Swift chat channel, which is where all the messages are
    // sent in this simple application
    print('Attempting to join "Swift" chat channel...');
    chatClient.getChannelByUniqueName('Swift')
    .then(function(channel) {
      swiftChannel = channel;
      console.log('Found Swift channel:');
      console.log(swiftChannel);
      setupSwiftChannel();
    }).catch(function() {
      // If it doesn't exist, let's create it
      console.log('Creating Swift channel');
      chatClient.createChannel({
        uniqueName: 'Swift',
        friendlyName: 'Swift Chat Channel'
      }).then(function(channel) {
        console.log('Created Swift channel:');
        console.log(channel);
        swiftChannel = channel;
        setupSwiftChannel();
      }).catch(function(channel) {
        console.log('Channel could not be created:');
        console.log(channel);
      });
    });
  }

  // Set up channel after it has been found
  function setupSwiftChannel() {
    // Join the Swift channel
    swiftChannel.join().then(function(channel) {
      print('Joined channel as '
      + '<span class="me">' + username + '</span>.', true);
    });

    // Listen for new messages sent to the channel
    swiftChannel.on('messageAdded', function(message) {
      printMessage(message.author, message.body);
    });
  }

  // Send a new message to the Swift channel
  var $input = $('#chat-input');
  $input.on('keydown', function(e) {
    if (e.keyCode == 13) {
      swiftChannel.sendMessage($input.val())
      $input.val('');
    }
  });
});
