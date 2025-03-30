export const currentUser = {
    id: "user-1",
    name: "Jasper Mellson",
    avatar: "https://via.placeholder.com/40",
    status: "online",
  }
  
  export const users = [
    {
      id: "user-2",
      name: "Jason Binoffe",
      avatar: "https://via.placeholder.com/40",
      status: "online",
    },
    {
      id: "user-3",
      name: "Messina Jason",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "5 mins ago",
    },
    {
      id: "user-4",
      name: "Arun Venkatchalam",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "2:34 PM",
    },
    {
      id: "user-5",
      name: "Yello Community",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "2:34 PM",
    },
    {
      id: "user-6",
      name: "Music CGG",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "2:34 PM",
    },
    {
      id: "user-7",
      name: "Likuan Henger",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "5:34 AM",
    },
    {
      id: "user-8",
      name: "Anand Srinivasan",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "Yesterday",
    },
    {
      id: "user-9",
      name: "Mary Twirl",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "10/20/2023",
    },
    {
      id: "user-10",
      name: "Rubek Hussa",
      avatar: "https://via.placeholder.com/40",
      status: "offline",
      lastSeen: "10/20/2023",
    },
  ]
  
  export const conversations = [
    {
      id: "conv-1",
      participants: [currentUser, users[0]],
      type: "individual",
      messages: [
        {
          id: "msg-1",
          senderId: "user-1",
          content: "Hi, is there any update on the filing? I want to get this moving fast.",
          timestamp: "6:33 pm",
        },
        {
          id: "msg-2",
          senderId: "user-2",
          content: "Hi Jasper. I will share the estimate today.",
          timestamp: "6:35 pm",
        },
        {
          id: "msg-3",
          senderId: "user-2",
          content: "We need to display this while unwrapping the box",
          timestamp: "6:36 pm",
          image: "https://via.placeholder.com/150",
          reactions: [
            {
              type: "👍",
              count: 1,
            },
          ],
        },
      ],
      lastMessage: {
        content: "We need to display this while unwrapping the box",
        timestamp: "6:36 pm",
      },
    },
    {
      id: "conv-2",
      participants: [currentUser, users[1]],
      type: "individual",
      messages: [
        {
          id: "msg-4",
          senderId: "user-3",
          content: "Any updates?",
          timestamp: "5 mins ago",
        },
      ],
      lastMessage: {
        content: "Any updates?",
        timestamp: "5 mins ago",
      },
      unread: true,
    },
    {
      id: "conv-3",
      participants: [currentUser, users[2]],
      type: "individual",
      messages: [
        {
          id: "msg-5",
          senderId: "user-4",
          content: "Any updates?",
          timestamp: "2:34 PM",
        },
      ],
      lastMessage: {
        content: "Any updates?",
        timestamp: "2:34 PM",
      },
    },
    {
      id: "conv-4",
      participants: [currentUser, users[3]],
      type: "individual",
      messages: [
        {
          id: "msg-6",
          senderId: "user-2",
          content: "Received. Thanks!",
          timestamp: "2:34 PM",
        },
      ],
      lastMessage: {
        content: "Received. Thanks!",
        timestamp: "2:34 PM",
      },
    },
    {
      id: "conv-5",
      participants: [currentUser, users[4]],
      type: "group",
      messages: [
        {
          id: "msg-7",
          senderId: "user-5",
          content: "Cool",
          timestamp: "2:34 PM",
        },
      ],
      lastMessage: {
        content: "Cool",
        timestamp: "2:34 PM",
      },
    },
    {
      id: "conv-6",
      participants: [currentUser, users[5]],
      type: "individual",
      messages: [
        {
          id: "msg-8",
          senderId: "user-6",
          content: "💜",
          timestamp: "2:34 PM",
        },
      ],
      lastMessage: {
        content: "💜",
        timestamp: "2:34 PM",
      },
    },
    {
      id: "conv-7",
      participants: [currentUser, users[6]],
      type: "individual",
      messages: [
        {
          id: "msg-9",
          senderId: "user-7",
          content: "I didn't get it",
          timestamp: "5:34 AM",
        },
      ],
      lastMessage: {
        content: "I didn't get it",
        timestamp: "5:34 AM",
      },
    },
    {
      id: "conv-8",
      participants: [currentUser, users[7]],
      type: "individual",
      messages: [
        {
          id: "msg-10",
          senderId: "user-8",
          content: "Love it",
          timestamp: "Yesterday",
        },
      ],
      lastMessage: {
        content: "Love it",
        timestamp: "Yesterday",
      },
    },
    {
      id: "conv-9",
      participants: [currentUser, users[8]],
      type: "individual",
      messages: [
        {
          id: "msg-11",
          senderId: "user-9",
          content: "Great!",
          timestamp: "10/20/2023",
        },
      ],
      lastMessage: {
        content: "Great!",
        timestamp: "10/20/2023",
      },
    },
  ]
  
  