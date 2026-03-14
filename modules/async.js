async function environment(msg) {
  data.message = msg; // Save history and file data
  
  // Push data to chat session, for previous conversation history
  data.history.push({
    role: 'user',
    parts: [
      { text: data.message },
      ...(data.file?.data ? [{ inline_data: (({ fileName, isImage, ...rest }) => rest)(data.file) }] : [])
    ]
  });
  
  try {
    const model = "gemini-2.5-flash"; // Set model
    const youtubeRegex = /\b(yt|youtube)\b/i;
    
    if (youtubeRegex.test(msg)) {
      const ytAuth = await (await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${msg}&key=AIzaSyCRzpbNMkmCOcVy1VCiHjiNzdqYnWvN2ec`)).json();
      
      return `<iframe src="https://www.youtube.com/embed/${ytAuth.items[0].id.videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe><br /><small>${ytAuth.items[0].snippet.description}</small>`;
    } else {
      // Send the chat history to the API to get a response
      const request = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': await getDataFromDB('apiKey'),
          },
          body: JSON.stringify({
            'system_instruction': {
              'parts': [{
                'text': 'You are a code assistant who has the capacity in the programming world to talk to ID, EN, ETC. Your main special roles are (Development) and (All) roles. Your name is Reapl!'
              }]
            },
            'contents': data?.history
          }),
          signal: new AbortController().signal
        }))
        .json(); // Get data with object type
      
      let response = request?.candidates?.[0]?.content?.parts?.[0]?.text ?? request?.error?.message ?? "No response"; // Process the response text and display
        
      // Add data with role (model) type 
      data.history.push({
        role: 'model',
        parts: [{ text: response }]
      });
           
      return useMarkUpText(response);
    }
  } catch (e) {
    console.error(e.stack);
    return e.message;
  } finally {
    data.file = {}; // Reset data file after response from model 
  }
}
