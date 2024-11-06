import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = ''

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

interface Chat {
  sendMessage: (text: string) => Promise<any>;
}


let chat = model.startChat({
  history: [
  ],
});

export async function generate(content: string): Promise<string> {
  const prompt = content + "\n\n" + "We have scraped above given data from the website, we want to refine this data in order to train our chatbot. Can you give us refined data and give us in a format such that we only need to copy without any additional texts in the response?";

  console.log(prompt);

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);

  return text;
};


export async function generateChatResponse(content: string): Promise<void> {
  chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
      {
        role: "user",
        parts: [{ text: content }],
      },
    ],
  });

  
  // let result = await sendMessage('What is the latest news on Kolkata rape case?');
  // console.log(result);
  
  // return result;
};

export async function sendMessage(userQue: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let result = await chat.sendMessage(userQue + '\n\n' + 'Give answer in precise and concise manner. Do not include any additional information or special characters.');
    // console.log(result.response.text());

    const response = await result.response;
    const text = response.text();

    resolve(text);
  });
}

// generateChatResponse("The Supreme Court on Tuesday announced the formation of a national task force of doctors to make recommendations on the safety of healthcare workers in their workplaces. This announcement came during court proceedings regarding the alleged rape and murder of a 31-year-old trainee doctor at RG Kar Medical College and Hospital in Kolkata earlier this month. A three-judge bench led by Chief Justice of India CJI Chandrachud, and comprising Justices J.B. Pardiwala and Manoj Misra, heard the case. The Supreme Court stated that the doctors’ panel will develop guidelines to ensure the safety and protection of medical professionals and healthcare workers across the country. “Protecting safety of doctors and women doctors is a matter of national interest and principle of equality. The nation cannot await another rape for it to take some steps,” CJI stated. The 10-member task force is expected to submit its interim report within three weeks and the final report within two months. The case is scheduled for the next hearing on August 22. During the hearing, the court also criticised the West Bengal government for its delay in filing an FIR in the rape-murder case and questioned the actions of the hospital authorities. Doctors and medics across the country have been protesting, holding candlelight marches, and temporarily refusing care for non-emergency patients since August 9 over the killing of the trainee doctor, demanding justice. They say that the assault highlights the vulnerability of healthcare workers in hospitals and medical campuses across India.");
