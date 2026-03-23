// Enhance generated-questions.json by adding an informative hint for each question
// The hint should be a fact, usage, creator, or general knowledge about the answer
// Only one informative hint per image/question
import fs from "fs";

const questions = JSON.parse(
  fs.readFileSync("db/generated-questions.json", "utf-8"),
);

// Map of answer to informative hint (expanded for all answers)
const informativeHints = {
  // AI
  ChatGPT: "An AI chatbot developed by OpenAI, based on the GPT architecture.",
  Gemini:
    "A family of AI models created by Google DeepMind, designed for multimodal tasks.",
  // Apps
  Avast:
    "A popular antivirus software developed by Avast Software, widely used for PC security.",
  Blender:
    "A free and open-source 3D creation suite used for modeling, animation, and rendering.",
  Docker:
    "A platform for developing, shipping, and running applications in containers.",
  GitLab:
    "A web-based DevOps lifecycle tool that provides a Git repository manager and CI/CD pipeline.",
  Github:
    "A code hosting platform for version control and collaboration, owned by Microsoft.",
  Postman:
    "A collaboration platform for API development, testing, and documentation.",
  Spotify:
    "A digital music streaming service founded in Sweden, offering millions of tracks.",
  "Stack Overflow":
    "A Q&A website for programmers, part of the Stack Exchange network.",
  Unity:
    "A cross-platform game engine developed by Unity Technologies, used for 2D and 3D games.",
  "Unreal Engine":
    "A powerful game engine developed by Epic Games, known for high-fidelity graphics.",
  "Windows defender":
    "A built-in antivirus and security suite for Microsoft Windows operating systems.",
  Youtube:
    "A video sharing and streaming platform owned by Google, launched in 2005.",
  // Browser
  "Apple Safari":
    "The default web browser for Apple devices, developed by Apple Inc.",
  Chrome:
    "A widely used web browser developed by Google, first released in 2008.",
  Firefox:
    "A free and open-source web browser developed by Mozilla Foundation.",
  "Internet Explorer 10 (ie10)":
    "A version of Microsoft's Internet Explorer browser, released in 2012.",
  // Clouds
  Cloudflare:
    "A web infrastructure and security company providing CDN and DDoS protection services.",
  Firebase:
    "A platform developed by Google for building and managing mobile and web applications.",
  "Google Cloud": "A suite of cloud computing services offered by Google.",
  MongoDB:
    "A popular open-source NoSQL database known for its flexibility and scalability.",
  // Frameworks
  Angular:
    "A TypeScript-based open-source web application framework led by the Angular Team at Google.",
  Electron:
    "A framework for building cross-platform desktop apps with JavaScript, HTML, and CSS.",
  Express:
    "A minimal and flexible Node.js web application framework for building APIs and web apps.",
  Flutter:
    "An open-source UI software development kit created by Google for building natively compiled apps.",
  Laravel:
    "A PHP web application framework with expressive, elegant syntax, created by Taylor Otwell.",
  "NET core":
    "A cross-platform, open-source framework for building modern, cloud-based apps from Microsoft.",
  "Nest.js":
    "A progressive Node.js framework for building efficient, scalable server-side applications.",
  NextJS:
    "A React framework for building server-rendered and static web applications, developed by Vercel.",
  React:
    "A JavaScript library for building user interfaces, developed by Facebook.",
  "Ruby on Rails":
    "A server-side web application framework written in Ruby, created by David Heinemeier Hansson.",
  Spring:
    "A powerful, feature-rich framework for building Java applications, especially web apps.",
  Svelte:
    "A modern JavaScript framework for building fast web applications, created by Rich Harris.",
  "Tailwind CSS":
    "A utility-first CSS framework for rapidly building custom user interfaces.",
  TensorFlow: "An open-source machine learning framework developed by Google.",
  "Vue.js Logo 2":
    "A progressive JavaScript framework for building user interfaces, created by Evan You.",
  // IDE
  "Android Studio":
    "The official IDE for Android development, based on JetBrains' IntelliJ IDEA.",
  Atom: "A hackable text editor for the 21st century, developed by GitHub.",
  PyCharm: "A Python IDE for professional developers, created by JetBrains.",
  Vim: "A highly configurable text editor built to enable efficient text editing.",
  "Visual Studio Code (VS Code)":
    "A free source-code editor made by Microsoft for Windows, Linux, and macOS.",
  "Visual Studio":
    "An integrated development environment (IDE) from Microsoft.",
  // OS
  Android:
    "A mobile operating system developed by Google, based on a modified Linux kernel.",
  Apple:
    "A technology company known for its hardware and software products, including macOS and iOS.",
  "Arch Linux":
    "A lightweight and flexible Linux distribution that tries to Keep It Simple.",
  Linux:
    "An open-source family of Unix-like operating systems based on the Linux kernel.",
  MacOS:
    "A series of proprietary graphical operating systems developed by Apple for Mac computers.",
  Ubuntu:
    "A popular Linux distribution based on Debian, developed by Canonical Ltd.",
  "Windows logo 2021":
    "The logo for Microsoft Windows, a family of operating systems developed by Microsoft.",
  debian:
    "A Unix-like operating system composed entirely of free software, developed by the Debian Project.",
  // Org
  GDG: "Google Developer Groups: community groups for developers interested in Google technologies.",
  Google:
    "A multinational technology company specializing in Internet-related services and products.",
  microsoft:
    "A multinational technology corporation, developer of Windows, Office, and Azure.",
  // Programming_Languages
  "C# (CSharp)":
    "A modern, object-oriented programming language developed by Microsoft.",
  "C++":
    "A general-purpose programming language created by Bjarne Stroustrup as an extension of C.",
  C: "A general-purpose, procedural computer programming language developed in the early 1970s.",
  CSS: "A style sheet language used for describing the presentation of a document written in HTML or XML.",
  Dart: "A client-optimized programming language for fast apps on any platform, developed by Google.",
  Erlang:
    "A general-purpose, concurrent, functional programming language, used for scalable systems.",
  Fortran:
    "A general-purpose, compiled imperative programming language, especially suited to numeric computation.",
  Go: "An open-source programming language designed at Google for simplicity and reliability.",
  HTML: "The standard markup language for documents designed to be displayed in a web browser.",
  Java: "A high-level, class-based, object-oriented programming language developed by Sun Microsystems.",
  Javascript:
    "A high-level, just-in-time compiled language that conforms to the ECMAScript specification.",
  Kotlin:
    "A cross-platform, statically typed, general-purpose programming language with type inference.",
  Lua: "A lightweight and high-level multi-paradigm programming language designed primarily for embedded use.",
  PHP: "A popular general-purpose scripting language especially suited to web development.",
  Python:
    "An interpreted, high-level, general-purpose programming language created by Guido van Rossum.",
  Ruby: "A dynamic, open source programming language with a focus on simplicity and productivity.",
  Rust: "A multi-paradigm, general-purpose programming language focused on performance and safety.",
  Swift:
    "A powerful and intuitive programming language for macOS, iOS, watchOS, and tvOS, developed by Apple.",
  "zig mark":
    "Zig is a general-purpose programming language and toolchain for maintaining robust, optimal, and reusable software.",
  // Random
  "Raspberry Pi":
    "A series of small single-board computers developed in the United Kingdom by the Raspberry Pi Foundation.",
  // Runtime
  Bun: "A fast JavaScript runtime, bundler, transpiler, and package manager – all in one.",
  "Node.js":
    "An open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser.",
  V8: "Google's open source high-performance JavaScript and WebAssembly engine, written in C++.",
  // Social_Media
  Facebook:
    "A social networking service launched in 2004, owned by Meta Platforms.",
  LinkedIn:
    "A business and employment-focused social media platform launched in 2003.",
  Twitter:
    "A social media platform for microblogging and social networking, now known as X.",
  // Terminals
  Bash: "A Unix shell and command language written by Brian Fox for the GNU Project.",
  Homebrew:
    "A free and open-source software package management system that simplifies the installation of software on macOS.",
  Powershell:
    "A task automation and configuration management program from Microsoft, consisting of a command-line shell and scripting language.",
  // Tools
  Apache:
    "A free and open-source cross-platform web server software, developed and maintained by the Apache Software Foundation.",
  ESLint:
    "A static code analysis tool for identifying problematic patterns in JavaScript code.",
  Git: "A distributed version control system created by Linus Torvalds in 2005.",
  Jest: "A delightful JavaScript testing framework maintained by Meta.",
  Mysql: "An open-source relational database management system based on SQL.",
  NPM: "A package manager for the JavaScript programming language, maintained by npm, Inc.",
  PostgresSQL:
    "A powerful, open source object-relational database system with over 30 years of active development.",
  "Vite.js":
    "A build tool that aims to provide a faster and leaner development experience for modern web projects.",
  Webpack:
    "An open-source JavaScript module bundler, primarily for JavaScript, but can transform front-end assets.",
};

for (const q of questions) {
  if (informativeHints[q.answer]) {
    q.hint = informativeHints[q.answer];
  } else {
    // Fallback: keep the old hint if no informative one is available
    q.hint = q.hint || `Category: ${q.category}. Starts with '${q.answer[0]}'.`;
  }
}

fs.writeFileSync(
  "db/generated-questions.json",
  JSON.stringify(questions, null, 2),
);
console.log("Informative hints added to questions.");
