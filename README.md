# Benocoding

>The ability to code is just the beginning  
>Don't stop  
>**Benocoding (Being not just coding)**  

## What is Benocoding?
* **An online course platform designed for coding**  
The idea was born out of my experience as a teaching assistant, where I discovered my passion for education while guiding students in learning Python. Inspired by this, I decided to construct an online platform where every individual can learn how to code  

## How to use this website?

**Website link: [https://benocoding.com](https://benocoding.com)**

1. Either sign up with email or GitHub to become a user  
2. Choose a role you want to be, a teacher or a student  
3. (Student) You can search for any topics you want to learn on the home page and buy a class to start learning  
4. (Teacher) Click the navigation at the header, create your first class

**_Example account_**
   * **Email:** user001@example.com
   * **Password:** User0012023 (Capitalize the first character)
   * **!! This user data would reset every hour to keep it clean**

**_Example credit card:_**  
   * **Card number: 4242 4242 4242 4242**
   * **Card expiration date: 04 / 24**
   * **Card CCV: 242**

## Key features
### 📌 function test  
[![Demo](/public/images/Benocoding_functionTestDemo.gif)](https://youtu.be/3WlDRwV8xbI)
### 📌 api test  
[![Demo](/public/images/Benocoding_apiTestDemo.gif)](https://youtu.be/vJIF7_bwlkw)

## MongoDB schema
![](/public/images/Benocoding_schema.png)

## Core techniques
![](/public/images/Benocoding_structure.png)
* **Scallable system**
  * Served front-end on AWS S3 and CloudFront to enhance the efficiency of website and make the server stateless
  * Integrated Socket.IO adapter with Redis to ensure the communication across distributed systems
* **Stress testing and optimizing**
  * Based on the traffic of the Hahow and PressPlay online course platforms, simulate a scenario where 30,000 active users make requests to the API daily
  * Several strategies were attempted, and ultimately, Redis cache was chosen, successfully optimizing response speed by 400% while achieving the best cost efficiency
* **CI/CD**
  * Constructed CI/CD pipeline through GitHub Actions for automated code deployment and a cron job to refresh test user data.
* **GraphQL**
  * Implemented API functionality with GraphQL to enhance the flexibility and efficiency of data retrieval and manipulation
* **Third-party APIs**
  * Integrated and leveraged third-party APIs (GitHub, OpenAI, TapPay) to implement quick signup, code reviews and payments, enhancing overall functionality and user experience

## Contact
* Email: c.s.fangyolk@gmail.com
* LinkedIn: [linkedin.com/in/sam-fang9527/](https://www.linkedin.com/in/sam-fang9527/)
