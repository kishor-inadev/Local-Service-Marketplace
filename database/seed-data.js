// =================================================================
// LOCAL SERVICE MARKETPLACE — REALISTIC SEED DATA
// Indian names, real business names, scenario-based descriptions
// =================================================================

const indianFirstNames = [
	'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Rohan', 'Ayaan',
	'Dhruv', 'Kabir', 'Ritvik', 'Anirudh', 'Pranav', 'Vikram', 'Amit', 'Rajeev',
	'Suresh', 'Mahesh', 'Ramesh', 'Rajesh', 'Santosh', 'Manish', 'Nitin', 'Deepak',
	'Priya', 'Diya', 'Ananya', 'Kavya', 'Anjali', 'Pooja', 'Sneha', 'Neha',
	'Riya', 'Deepika', 'Shreya', 'Meera', 'Nisha', 'Sunita', 'Rekha', 'Shalini',
	'Geeta', 'Seema', 'Poonam', 'Kiran', 'Lakshmi', 'Usha', 'Aryan', 'Harsh',
	'Yash', 'Tushar', 'Gaurav', 'Rahul', 'Vishal', 'Vinay', 'Tarun', 'Varun',
	'Rohit', 'Mohit', 'Sumit', 'Amit', 'Ravi', 'Shiv', 'Ajay', 'Vijay',
];

const indianLastNames = [
	'Sharma', 'Verma', 'Singh', 'Kumar', 'Patel', 'Shah', 'Mehta', 'Joshi',
	'Gupta', 'Rao', 'Reddy', 'Nair', 'Pillai', 'Iyer', 'Menon', 'Tiwari',
	'Mishra', 'Agarwal', 'Bansal', 'Malhotra', 'Kapoor', 'Khanna', 'Bajaj', 'Bhat',
	'Desai', 'Naidu', 'Patil', 'Chauhan', 'Srivastava', 'Pandey', 'Dubey', 'Yadav',
	'Tripathi', 'Shukla', 'Saxena', 'Chatterjee', 'Das', 'Roy', 'Sen', 'Ghosh',
];

const indianServiceBusinessNames = [
	'Sharma Home Services', 'Patel Plumbing Solutions', 'Singh Electrical Works',
	'Kumar Carpentry Studio', 'Mehta Cleaning Solutions', 'Joshi AC Services',
	'Gupta Pest Control', 'Reddy Appliance Care', 'Nair Home Tutors', 'Iyer Mobile Fix',
	'Verma Home Chef', 'Tiwari Tech Support', 'Kapoor Beauty Studio', 'Malhotra Movers',
	'Bansal Aqua Solutions', 'Desai CCTV Systems', 'Naidu FitZone', 'Patil Car Spa',
	'Chauhan Boutique Hub', 'Pandey Power Backup', 'Agarwal Multi Services',
	'Mishra Home Experts', 'Bhat Electricals', 'Shah Master Services', 'Rao Construction Group',
	'Krishna Plumbing Works', 'Suresh Repair Centre', 'Rajesh Home Care', 'Vijay Services',
	'Mumbai Home Experts', 'Delhi Service Hub', 'Chennai Pro Services', 'Bengaluru Tech Fix',
	'Hyderabad Home Care', 'Pune Service Pro', 'Jaipur Home Solutions', 'Kolkata Experts',
	'Swastik Services', 'Om Sai Services', 'Balaji Home Care', 'GreenClean Solutions',
	'FastFix India', 'HomeHelp Pro', 'QuickServe India', 'TrustCare Services',
	'ServicePlus India', 'ProHome Works', 'ApnaTech Services', 'Urban Home Care',
];

const providerBios = [
	'We provide professional home services with over 10 years of experience. All our technicians are certified and background-verified. We guarantee quality work and 100% customer satisfaction.',
	'Specialising in quick and reliable repairs for all major brands. Our team arrives on time and we offer a 30-day service warranty on all completed jobs.',
	'Your trusted local service partner for all home maintenance needs. We are fully insured, transparent in pricing, and provide detailed service reports after every job.',
	'Experienced professionals serving the local community for over 8 years. We use only genuine spare parts and eco-friendly products in all our work.',
	'Premium-quality service at affordable prices. We prioritise customer convenience with flexible scheduling including weekends and public holidays.',
	'Certified and trained technicians with a proven track record of 5,000+ successful jobs. Transparent pricing with no hidden charges — ever.',
	'A team of skilled professionals dedicated to delivering fast and affordable home solutions. Our technicians arrive fully equipped and ready to work.',
	'Trusted by thousands of households across the city. We provide comprehensive home services with guaranteed satisfaction on every job.',
	'Family-run business with deep roots in the local community. We treat your home with the same care and respect as our own.',
	'On-demand service with verified technicians. All our work comes with a service guarantee and we stand behind every job we do.',
	'Fully insured with professional indemnity cover. We follow strict safety standards and always clean up thoroughly after every job.',
	'Specialists with formal trade certifications and regular training updates. We stay equipped with the latest tools to deliver the best results every time.',
];

const requestDescriptionsByCategory = {
	'Plumbing': [
		'Kitchen sink is leaking and causing water damage to the cabinet below. Need urgent repair.',
		'Bathroom tap is dripping constantly — significant water wastage. Need it fixed as soon as possible.',
		'Water pipe has burst under the bathroom floor. Need immediate emergency repair.',
		'Flush tank is not filling properly. Need a plumber to inspect and fix the float valve.',
		'New bathroom installation needed — washbasin, shower head, and flush tank fittings.',
		'Water pressure is very low throughout the house. Need full inspection and repair.',
		'Bathroom drain is completely clogged. Water is pooling and not draining at all.',
	],
	'Electrical': [
		'Power sockets in the living room are not working. Three sockets affected, possibly a wiring issue.',
		'Ceiling fan installation needed in 2 bedrooms — fans purchased, only installation required.',
		'Circuit breaker trips frequently. Need an electrician to inspect the wiring and fix the fault.',
		'LED lighting installation for the entire house — 4 rooms and 2 bathrooms.',
		'Need a new 15A power point added near the TV unit in the living room.',
		'Home inverter is not charging properly. Needs repair or battery replacement check.',
		'Outdoor garden lights not working. Need full wiring inspection and repair.',
	],
	'Carpentry': [
		'Kitchen cabinets need repair — two cabinet doors have broken hinges.',
		'Need custom wooden wardrobe for master bedroom. Size: 6ft x 3ft x 2ft.',
		'Bedroom door stuck and not closing properly. Hinge or door frame may need adjustment.',
		'Living room wooden flooring has some loose and creaking boards. Need fixing.',
		'Looking for a carpenter to build a study table for my child\'s room.',
		'Bathroom wooden door is swollen due to moisture. Needs planing and resealing.',
	],
	'Painting': [
		'Full 3BHK apartment needs interior painting before we move in. Walls only, no ceiling.',
		'Living room and master bedroom need a fresh coat of paint. Walls are dull and peeling.',
		'Exterior wall of the house is faded and peeling. Need weatherproof exterior paint.',
		'Looking for a creative painter for a feature wall design in the living room.',
		'Office cabin painting needed — 3 rooms, walls and ceiling. Must match existing colour scheme.',
		'Entire 2BHK flat exterior repaint needed due to significant weather damage.',
	],
	'Cleaning': [
		'Deep cleaning needed for entire 2BHK flat before moving in. Kitchen and bathrooms especially.',
		'Post-renovation cleaning required. Construction dust on every surface, needs thorough clean.',
		'Weekly house cleaning service needed for a 3BHK apartment. 3 hours per visit.',
		'Sofa and carpet deep cleaning required. 3-seater sofa and one 6 x 4ft carpet.',
		'Office cleaning contract needed — 5 days a week, 1,500 sq ft office space.',
		'End of tenancy cleaning needed urgently. Flat needs to be spotless for handover inspection.',
	],
	'AC Service & Repair': [
		'Split AC not cooling properly even after running for 1 hour. 1.5 ton LG unit.',
		'AC is leaking water from the indoor unit onto the wall. Need urgent inspection.',
		'Annual service for 3 split ACs in my apartment — all 1.5 ton units.',
		'New 1.5 ton split AC installation needed in the master bedroom. Unit already purchased.',
		'AC compressor makes a loud noise when starting. Needs diagnosis and repair.',
		'AC remote control not working and unit not responding. Needs diagnosis.',
	],
	'Pest Control': [
		'Cockroach infestation found in kitchen and bathrooms. Need comprehensive treatment.',
		'Termite damage visible on wooden furniture and door frames. Need professional treatment.',
		'Bed bugs found in the master bedroom mattress. Need immediate treatment.',
		'Annual general pest control for entire 3BHK apartment. Last service was 12 months ago.',
		'Rat problem — they are entering through gaps in the walls and kitchen pipes.',
		'Ant infestation in the kitchen. Need gel treatment and full inspection.',
	],
	'Appliance Repair': [
		'Washing machine not spinning. Error code E3 is showing on the display.',
		'Refrigerator not cooling sufficiently. Food is spoiling faster than normal.',
		'Microwave oven stopped working suddenly. No power when pressing start.',
		'Dishwasher leaking water from the door seal during wash cycles.',
		'Geyser not heating water. The heating element may be faulty.',
		'Television has a vertical line on the display panel. Needs inspection.',
	],
	'Home Tutor': [
		'Maths and science tutor needed for Class 10 CBSE student. 5 days a week, 2 hours each.',
		'English speaking and grammar tutor needed for a working professional.',
		'JEE preparation coaching needed for PCM subjects. 2 hours daily, 6 days a week.',
		'Primary school home tutor needed for Std 3 student — all subjects.',
		'Physics tutor needed for Class 12 board exam preparation. March exams approaching.',
		'Basic music lessons needed for children — guitar and keyboard, weekends only.',
	],
	'Mobile Repair': [
		'iPhone 14 screen cracked badly. Need screen replacement with original Apple part.',
		'Samsung Galaxy S23 battery draining too fast. Battery replacement needed.',
		'OnePlus phone charging port is loose. Charges only in certain positions.',
		'Phone fell in water and is not turning on. Need diagnosis and data recovery.',
		'Back glass of Redmi Note 12 is cracked. Need glass-only replacement.',
	],
	'Cook / Home Chef': [
		'Need a daily cook for breakfast and lunch in a 4-member family. Vegetarian only.',
		'Looking for a cook for a weekend dinner party — 20 guests, multi-cuisine menu.',
		'Part-time cook needed for dinner preparation on weekdays for 2 people.',
		'Tiffin service needed for office — 2 lunch boxes per day, home-cooked style.',
		'Special occasion catering — birthday party for 30 people. Snacks and full dinner.',
	],
	'Computer Repair': [
		'Laptop not turning on at all. Power light blinks but screen stays black.',
		'Dell laptop keyboard has stopped working. Several keys completely non-responsive.',
		'Computer running very slowly. Virus suspected or may need SSD upgrade.',
		'Hard disk making a clicking noise. Data recovery and disk replacement needed.',
		'Desktop PC needs RAM upgrade from 8GB to 16GB for better performance.',
	],
	'Beauty & Grooming': [
		'Looking for a home salon visit for haircut, blow-dry, and head massage.',
		'Bridal makeup and hairstyling needed for wedding ceremony this Saturday.',
		'Pedicure, manicure, and facial needed at home. Prefer an experienced beautician.',
		'Full body waxing and threading service needed at home — female professional only.',
		'Hair colouring service at home — global colour, medium-length hair.',
	],
	'Packers & Movers': [
		'Relocating from a 2BHK apartment to another building 5 km away. Need full packing and moving.',
		'Office shifting — 15 workstations, furniture, and 30 boxes of files.',
		'Single bedroom flat relocation to another city. Need insured transport.',
		'Need packing service only — transport already arranged, just need professional packing.',
		'Piano shifting and special packing needed to an apartment on the 5th floor.',
	],
	'Water Purifier Service': [
		'RO water purifier not working normally. Water output is low and TDS reading is high.',
		'Annual maintenance service needed for Kent RO unit. All filters are due for change.',
		'New RO water purifier installation needed in kitchen.',
		'UV lamp in the purifier needs replacement. Carbon filter also due for change.',
		'Water purifier showing error code E5. Technician needed for diagnosis.',
	],
	'CCTV Installation': [
		'Need 4 CCTV cameras installed at home — front door, backyard, garage, and hall.',
		'Office CCTV system installation — 8 cameras, 30-day recording NVR.',
		'Existing CCTV NVR has stopped recording. Need repair or replacement.',
		'Night vision cameras needed for outdoor coverage of the full property perimeter.',
		'CCTV system upgrade needed — current cameras are very low resolution.',
	],
	'Yoga / Fitness Trainer': [
		'Looking for a morning yoga trainer for daily 1-hour sessions at home.',
		'Weight loss and strength training programme needed. 5 days a week.',
		'Post-delivery weight loss programme. Need a gentle and experienced female trainer.',
		'Zumba classes at home for a group of 4 friends — 3 days a week.',
		'Corporate wellness yoga sessions needed for office of 20 employees.',
	],
	'Car Wash & Detailing': [
		'Full body detailing and ceramic coating needed for my Honda City 2023.',
		'Regular weekly car wash service needed at home — doorstep service preferred.',
		'Interior deep cleaning for my SUV. Seats, carpet, dashboard, and door panels.',
		'Engine bay cleaning and underbody wash needed before annual service.',
		'Dent removal and paint touch-up needed after a minor parking accident.',
	],
	'Tailoring & Alterations': [
		'Saree blouse stitching needed. Have the cloth, need only stitching with measurements.',
		'Formal shirt sleeve alteration — need to shorten by 1.5 inches.',
		'Bridal lehenga fitting and minor alterations needed before the wedding.',
		'Running stitch on 5 pairs of school trousers for my children.',
		'Curtain stitching for 4 windows — cloth purchased, need only stitching.',
	],
	'Inverter & Battery Service': [
		'Home inverter is not charging. Battery backup has dropped to under 1 hour.',
		'New inverter and battery set installation needed for 5 lights and 2 fans.',
		'Inverter making a loud continuous beeping sound. Battery health check needed.',
		'UPS for desktop computer stopped working. Need repair or replacement.',
		'Inverter battery water level very low. Refilling and full system check needed.',
	],
	'default': [
		'Looking for a skilled professional to help with this task at my home.',
		'Need a reliable and experienced person to complete this job efficiently.',
		'Urgent work required. Willing to pay a fair price for quality service.',
		'Please do a site inspection and provide a quote before starting work.',
		'Regular maintenance work required. Looking for a long-term service provider.',
	],
};

const proposalMessages = [
	'Hello! I have over 8 years of experience in this type of work and can complete the job within the estimated timeframe. I use quality materials and guarantee my work. Please feel free to ask any questions.',
	'I am a certified professional and have handled many similar projects. My pricing is transparent with no hidden charges. I can start as early as tomorrow morning.',
	'Thank you for the request. I have reviewed the details and I am confident I can resolve this efficiently. I carry all necessary tools and spare parts.',
	'I specialise in exactly this type of work. I have completed 200+ similar jobs and maintained a 4.9 star rating. I offer a 30-day workmanship guarantee on every job.',
	'Hi, I can help you with this. I am local to your area and can visit for a free inspection first. Once I assess the problem, I will give you an exact quote before starting.',
	'We are a professional team with all required certifications. We take only the jobs we can do well. We bring all necessary spare parts so there is no delay once we start.',
	'I have been doing this professionally for 12 years. I am reliable, punctual, and thorough. I can accommodate your preferred time slot including weekends.',
	'I will assess the issue on-site and provide a detailed estimate. No work begins without your approval on the final quote. 100% transparency guaranteed.',
	'I can visit today or tomorrow as per your convenience. I have handled this exact issue many times and know the most efficient way to fix it. All materials are included in my price.',
	'Professional with a strong background in this domain. I pride myself on clean work, respecting your property, and timely completion. References available on request.',
];

const reviewCommentsByRating = {
	5: [
		'Outstanding service! The technician was highly professional, arrived on time, and finished the job quickly and cleanly. Will definitely hire again.',
		'Absolutely brilliant. Diagnosed the problem in minutes and fixed it perfectly. Honest pricing, no unnecessary upselling. Highly recommended!',
		'Best service experience I have had. Very knowledgeable, respectful of our home, and left the place spotless after finishing. 5 stars without hesitation.',
		'Exceeded all expectations. Prompt, skilled, and very friendly. The work quality is top-notch and everything is working perfectly now.',
		'Fantastic! The professional arrived before time, explained everything clearly, and completed the work in half the time I expected. Great value for money.',
	],
	4: [
		'Good service overall. Work was done neatly and on time. Minor delay in arrival but communicated in advance. Would hire again.',
		'Very happy with the quality of work. The professional was skilled and polite. A small extra charge was added but it was justified.',
		'Solid job done. The problem is completely fixed. Would have given 5 stars but the follow-up communication was a bit slow.',
		'Professional and tidy work. Took slightly longer than estimated but the end result is great. No complaints about quality.',
	],
	3: [
		'Average experience. The work is done and functional but it felt rushed. Could have been more careful with clean-up afterwards.',
		'The job was completed but I had to remind them twice about a detail we had discussed. Work quality is acceptable.',
		'Decent service, not the smoothest experience but the problem is resolved. Would consider only if no other options nearby.',
		'Work was completed to a basic standard. Nothing exceptional but nothing terrible either. Got what I paid for.',
	],
	2: [
		'Disappointing. Arrived late and seemed unprepared. Had to leave mid-job to buy parts which caused significant delays.',
		'Work quality is below standard. Had to call another professional to finish what was left incomplete. Would not recommend.',
		'Communication was poor. Did not respond to messages for hours. When they arrived, the job took much longer than quoted.',
	],
	1: [
		'Very poor experience. The technician did not seem to know what they were doing. The problem is still not fixed after the visit.',
		'Worst service. Arrived 3 hours late with no update, did a shoddy job, and refused to rectify it without extra charges. Avoid completely.',
		'Terrible. Damaged more than they fixed. Completely unprofessional. Took money and did not complete the job.',
	],
};

const providerResponses = [
	'Thank you so much for your kind words. It was a pleasure serving you. We look forward to helping you again in the future!',
	'We really appreciate your feedback. We are glad we could resolve the issue for you. Please reach out any time you need us.',
	'Thank you for the review. Customer satisfaction is our top priority. We hope to serve you again!',
	'We are happy you are satisfied with our work. Thank you for trusting us with your home.',
	'Thank you for your honest feedback. We take all reviews seriously and will use this to improve our service.',
];

const realCouponCodes = [
	'SAVE10', 'FIRST50', 'WELCOME20', 'SUMMER25', 'FESTIVE15',
	'NEWUSER30', 'REFER50', 'LOYALTY20', 'FLASH40', 'SPECIAL25',
	'DIWALI30', 'HOLI20', 'EIDSPECIAL', 'MONSOON15', 'WINTER10',
	'HOMECARE25', 'CLEANPRO20', 'FIXITFAST', 'QUICKFIX15', 'PROCARE30',
	'GOLD50', 'SILVER30', 'PREMIUM20', 'VIP40', 'EARLY15',
	'WEEKEND20', 'BIRTHDAY50', 'ANNIVERSARY30', 'STUDENT15', 'TRIAL25',
];

const disputeReasons = [
	'The provider did not complete the work as described in the proposal. Key tasks were left incomplete without explanation.',
	'Provider arrived 4 hours late with no communication and then left before finishing the job.',
	'The quality of work is far below what was promised. The problem has actually worsened since the visit.',
	'Provider charged Rs. 3,000 more than the agreed amount without prior communication or approval.',
	'Materials used are clearly substandard and different from what was agreed in the proposal.',
	'Provider was rude and unprofessional and left the site in a complete mess.',
	'Service was not completed on the agreed date and provider has stopped responding to messages.',
	'Work done was defective — the same issue recurred within 3 days of the repair.',
];

const disputeResolutions = [
	'Issue resolved after full investigation. A 50% refund was issued to the customer.',
	'Provider confirmed completion. Customer agreed to close the dispute after review.',
	'Full refund issued to customer after provider failed to respond within 48 hours.',
	'Dispute closed — both parties reached a mutual agreement with a partial refund.',
	'Service re-performed by provider at no extra charge. Customer confirmed satisfaction.',
];

const conversationMessages = [
	'Hi, I have accepted your proposal. Can you please confirm your availability for tomorrow morning at 10 AM?',
	'Sure, I will be there by 10 AM sharp. Please keep the area accessible. I will bring all required tools.',
	'Great! Just to confirm — the address shown in the app is correct, right?',
	'Yes that is correct. I have also noted the special requirements you mentioned.',
	'Could you also check the other bathroom while you are here? It might need attention too.',
	'Of course, I will inspect both bathrooms and let you know if anything additional is required.',
	'Thank you! Just sent the advance payment through the app.',
	'Confirmed, payment received. See you tomorrow. Please make sure someone is home to let me in.',
	'Running 10 minutes late due to traffic. Will be there by 10:15 AM. Sorry for the delay.',
	'No problem at all, take your time. I am home.',
	'Work is complete. Please check everything and confirm it is to your satisfaction.',
	'Looks great! Everything is working perfectly. Thank you so much!',
	'You are welcome! Please do leave a review if you are happy with the service.',
	'Already gave you 5 stars — you guys are the best. Will call again for sure.',
	'Do you also provide annual maintenance contracts for this type of work?',
	'Yes we do! I will send you the AMC details. It covers 2 visits and priority support.',
	'Can you please provide a spare parts invoice for the work done today?',
	'Of course. I will send the invoice to your registered email within the hour.',
	'The water pressure seems a bit low in the upstairs bathroom. Could it be related?',
	'I will come and have a look within 24 hours at no additional charge. Your satisfaction matters.',
];

const contactSubjects = [
	'Unable to log in to my account',
	'Provider did not show up for the booked job',
	'Refund not received after 7 days',
	'How do I cancel a service request?',
	'App is not showing my booking history',
	'Provider charged more than the agreed price',
	'I want to become a service provider on the platform',
	'Payment failed but amount was deducted from bank',
	'Review option not showing after job completion',
	'My account has been suspended — need clarification',
	'How do I change my registered mobile number?',
	'Provider was rude and unprofessional',
	'Partnership and enterprise services enquiry',
	'Feature suggestion for the app',
	'Unable to upload documents during provider registration',
];

const contactMessageBodies = [
	'I have been trying to log in for the past hour and keep getting an invalid credentials error even after resetting my password. Please help resolve this urgently.',
	'My booked provider for today did not show up at the agreed time. It has now been 2 hours and they are not responding to messages. I need either a refund or an immediate replacement.',
	'I raised a refund request 7 days ago but have not received the amount back in my account. Please check and resolve this urgently.',
	'I need to cancel a service request I placed yesterday. Could you guide me on how to do this, or cancel it from your end?',
	'The provider quoted Rs. 800 on the app but charged Rs. 1,500 in cash after the work, citing extra materials. I did not approve this extra charge.',
	'I am a professional electrician with 10 years of experience and would like to register as a service provider. What are the requirements and what documents are needed?',
	'Very happy with the service I received. The technician was prompt, professional, and highly skilled. Please pass on my appreciation to the team.',
	'My payment of Rs. 1,200 failed but the amount has been deducted from my bank account. Please refund or confirm the booking urgently.',
	'This platform is excellent. Very easy to use and I have found reliable professionals for all my home service needs. Keep up the good work!',
	'The app is not showing my completed jobs from 3 months ago in the booking history tab. Is there a viewing restriction or is this a bug?',
];

module.exports = {
	indianFirstNames,
	indianLastNames,
	indianServiceBusinessNames,
	providerBios,
	requestDescriptionsByCategory,
	proposalMessages,
	reviewCommentsByRating,
	providerResponses,
	realCouponCodes,
	disputeReasons,
	disputeResolutions,
	conversationMessages,
	contactSubjects,
	contactMessageBodies,
};
