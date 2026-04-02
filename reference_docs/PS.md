Word to Markdown
Step 1
Upload a .docx file
Drag-and-drop the file below to upload.

Google doc? File → Download as → .docx.

Step 2
Get back crisp, clean Markdown
# H1

Paragraph

## H2

Paragraph

### H3

Paragraph
        
Step 3
???
Makeathon-EventHub.docx Submit
Warning: This document has sensitivity labels (detected in custom properties). Please ensure you have permission to convert and share this content.

Results of converting Makeathon-EventHub.docx
Copy markdown to clipboard
Markdown
# **_PROBLEM STATEMENT NAME_**

## TAGS

# Problem Owner Details

| Role            | Expectations (do not edit)                                                                                                                               | Mail IDs        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Problem Owner\* | Who has identified and elaborated the problem                                                                                                            | Vidya_Hariharan |
| Account, if any | If it is relevant to a specific account, please mention                                                                                                  | Infosys         |
| Mentors         | Technical team who will be able to provide clarifications on the problem, define the score and guide the hackathon participants on the solution approach |                 |

# Problem Description

# Description

Multiple Events are conducted by different teams across Infosys at Location level and Unit level. All the communication happens over emails which creates a lot of noise in everybody's mailbox. As a result, employees start missing out even the events that they might be interested to participate in.

# Business Context (Describe the problem and its impact)

Across Infosys, several departments and groups constantly organize interesting events on Technology, Domain, Products, Health, Fun and several other areas. Email acts as the single point of connect for everything from project work and collaboration to any other form of communication. This creates a lot of noise as well as dilution of messaging.

- An Event Hub where each and every event is published.
- Initial version of the Hub can be focused on automation and convenience but later versions will have intelligence to make suggestions to the user as per their interests, participation trends, availability, nature of current work, learning goals, and work load.
- Takes the load completely off the mailbox. Helps the users to stay organized. The Event Hub presents a clear view of all that is happening in a clearly tagged fashion with cool features for users to choose and participate in what matters to them. The Event Hub also enables event organizers to publish and campaign for their events in their styles without having to depend on any other team. Employee can choose the levels of notification as per their personal preferences.

# Key Stakeholders

Five key stakeholder groups are relevant to this problem. It's important to distinguish between those who make decisions and those who experience the platform day-to-day.

| Roles           | Actions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App Admin       | Maintain App Configuration, accesses levels, Monitor performance and error logs                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Event Organizer | Each Group(Org/Geo/Unit/Subunit/Location/list of DLs) will have be mapped to one or more event organizers.<br><br>Event Organizers can create events or approve events proposed by employees.<br><br>They will validate for any clash in slots, venue availability etc before approving the event. In case there is clash with another event, the organizer can decide on whether to approve or propose a different slot.<br><br>They will also handle setting up the bridge, ensuring reminders are sent and all other forms of campaign as necessary. |
| Governance team | Each Group(Org/Geo/Unit/Subunit/Location/list of DLs) will be mapped to one or more governance team members ( IC or HR). They will have access to features to help with campaigning for the event                                                                                                                                                                                                                                                                                                                                                       |
| Event Speakers  | In Speaker role, employees can propose events and select groups for which the event needs to be organized. The associated organizers and governance teams will get involved to take it forward                                                                                                                                                                                                                                                                                                                                                          |
| Event Audience  | All Employees will be able to view and filter on events that interests them. They can set their preferences so that by default they only see events that match their choices.                                                                                                                                                                                                                                                                                                                                                                           |

In addition to above, the IS team will also be key stakeholders for integrations : InfyMe Banners, Viva Engage Announcements, InfyMe Notifications

# Solution Features

# Deliverables

A single platform with discoverable events, JIT attendance, Registration workflow, enterprise-grade calendar, attendance integration, campaigning capabilities, customizable notification features, intelligent suggestions and notifications based on User preferences, interests, participation trends, availability, nature of current work, learning goals, and work load.

# Must Have

- Runs in the background for all employees
- Must have 4 personas- App Admin, Event Organizer, Governance team, Speaker, Audience

**Audience**

- Employees can configure their preferences on - Event Type, frequency, notification mechanism
- Users can view the published events and add selected ones to their outlook calendars
- The view will list all the published events in order of timing in an intuitive and organized manner
- User can configure the view for 1 day, multiple days or a week
- The EventHub will popup as per the end user's notification configuration which can be specific times of day or it can be when user logs in after being away for over an hour. At other times, user can launch voluntarily, else it will be in background.

**Speakers**

- Users can propose events for specific groups/chapter that are approved by the admin of that group/chapter. Once approved, the event will show up on the those group user's eventHub
- To propose an event, the user will have to provide basic session metadata that will be used to create the event calendar. The session metadata will include Topic, Topic Brief, date, timing, duration, speaker name, speaker title, speaker linkedin, speaker headshot. In case of multiple sessions in an event, the same set of session metadata to be repeated on user request.

**Organizer**

- The user can switch to organizer role where in they will receive the event publishing requests to approve, dismiss or modify.
- They will also be able to send notifications for approved events
- They can schedule campaigns for each event on select channels from MS Teams and select groups in Viva Engage. Once the campaign is scheduled for Teams channels or Viva Engage groups, they will be posted automatically.

**App Admin**

- Maintain the access matrix for Organizers and Governance team
- Maintain app configuration and changes as need be
- Ability to access to all features that governance and organizers have for all events
- Monitor logs and app performance

# Good to Have

Intelligent suggestions and notifications based on User preferences, interests, participation trends, availability, nature of current work, learning goals, and work load.

App can also act as a News Hub where leaders can post on latest happenings in technology and business. Everyone can express their views. This will help all employees to get a sense of organizations focus, and also their views on current developments.

# Existing Solutions/Products

None in Infosys

# Reference

# Relevance

Org wide

# Requirement

# Software Required, if any (Mention suggested technologies to be used)

MERN stack and SLM for the AI features

# Hardware Required, if any (will need to be funded by the account)

Laptop

# How to test (How can the solution be tested and what will be expected in the demo)

It can be easily demonstrated for each persona starting from Admin to the end user.

# Input datasets (Problem Owner needs to share the datasets relevant to the problem)

- NA

# Evaluation Criteria (Add other solution specific parameters that will be measured to judge the solution)

| Creativity                                         | How creative or innovative is the idea within the given challenge? Has this been done before, or is this something completely new and original idea (architecture, design and implementation)? | 10% |     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | --- |
| Innovative Technology & Quality                    | How you have utilized the existing technologies to their solution and quality of code?                                                                                                         | 20% |     |
| User experience and functionality                  | Is the overall user experience intuitive? Does the flow make sense?                                                                                                                            | 10% |     |
| Simplicity                                         | How elegantly does it solve the problem (smart vs harder)?                                                                                                                                     | 10% |     |
| Feasibility/Impact/Reuse/Extensibility/ Modularity | Does your solution work? Can it be implemented at scale? Can it be extended to other similar problem statements?                                                                               | 30% |     |
| Progress and Execution                             | How much is accomplished in a day?                                                                                                                                                             | 10% |     |
| Demo & Presentation                                | How well did the team present?                                                                                                                                                                 | 10% |     |
Rendered
PROBLEM STATEMENT NAME
TAGS
Problem Owner Details
Role	Expectations (do not edit)	Mail IDs
Problem Owner*	Who has identified and elaborated the problem	Vidya_Hariharan
Account, if any	If it is relevant to a specific account, please mention	Infosys
Mentors	Technical team who will be able to provide clarifications on the problem, define the score and guide the hackathon participants on the solution approach	
Problem Description
Description
Multiple Events are conducted by different teams across Infosys at Location level and Unit level. All the communication happens over emails which creates a lot of noise in everybody's mailbox. As a result, employees start missing out even the events that they might be interested to participate in.

Business Context (Describe the problem and its impact)
Across Infosys, several departments and groups constantly organize interesting events on Technology, Domain, Products, Health, Fun and several other areas. Email acts as the single point of connect for everything from project work and collaboration to any other form of communication. This creates a lot of noise as well as dilution of messaging.

An Event Hub where each and every event is published.
Initial version of the Hub can be focused on automation and convenience but later versions will have intelligence to make suggestions to the user as per their interests, participation trends, availability, nature of current work, learning goals, and work load.
Takes the load completely off the mailbox. Helps the users to stay organized. The Event Hub presents a clear view of all that is happening in a clearly tagged fashion with cool features for users to choose and participate in what matters to them. The Event Hub also enables event organizers to publish and campaign for their events in their styles without having to depend on any other team. Employee can choose the levels of notification as per their personal preferences.
Key Stakeholders
Five key stakeholder groups are relevant to this problem. It's important to distinguish between those who make decisions and those who experience the platform day-to-day.

Roles	Actions
App Admin	Maintain App Configuration, accesses levels, Monitor performance and error logs
Event Organizer	Each Group(Org/Geo/Unit/Subunit/Location/list of DLs) will have be mapped to one or more event organizers.Event Organizers can create events or approve events proposed by employees.They will validate for any clash in slots, venue availability etc before approving the event. In case there is clash with another event, the organizer can decide on whether to approve or propose a different slot.They will also handle setting up the bridge, ensuring reminders are sent and all other forms of campaign as necessary.
Governance team	Each Group(Org/Geo/Unit/Subunit/Location/list of DLs) will be mapped to one or more governance team members ( IC or HR). They will have access to features to help with campaigning for the event
Event Speakers	In Speaker role, employees can propose events and select groups for which the event needs to be organized. The associated organizers and governance teams will get involved to take it forward
Event Audience	All Employees will be able to view and filter on events that interests them. They can set their preferences so that by default they only see events that match their choices.
In addition to above, the IS team will also be key stakeholders for integrations : InfyMe Banners, Viva Engage Announcements, InfyMe Notifications

Solution Features
Deliverables
A single platform with discoverable events, JIT attendance, Registration workflow, enterprise-grade calendar, attendance integration, campaigning capabilities, customizable notification features, intelligent suggestions and notifications based on User preferences, interests, participation trends, availability, nature of current work, learning goals, and work load.

Must Have
Runs in the background for all employees
Must have 4 personas- App Admin, Event Organizer, Governance team, Speaker, Audience
Audience

Employees can configure their preferences on - Event Type, frequency, notification mechanism
Users can view the published events and add selected ones to their outlook calendars
The view will list all the published events in order of timing in an intuitive and organized manner
User can configure the view for 1 day, multiple days or a week
The EventHub will popup as per the end user's notification configuration which can be specific times of day or it can be when user logs in after being away for over an hour. At other times, user can launch voluntarily, else it will be in background.
Speakers

Users can propose events for specific groups/chapter that are approved by the admin of that group/chapter. Once approved, the event will show up on the those group user's eventHub
To propose an event, the user will have to provide basic session metadata that will be used to create the event calendar. The session metadata will include Topic, Topic Brief, date, timing, duration, speaker name, speaker title, speaker linkedin, speaker headshot. In case of multiple sessions in an event, the same set of session metadata to be repeated on user request.
Organizer

The user can switch to organizer role where in they will receive the event publishing requests to approve, dismiss or modify.
They will also be able to send notifications for approved events
They can schedule campaigns for each event on select channels from MS Teams and select groups in Viva Engage. Once the campaign is scheduled for Teams channels or Viva Engage groups, they will be posted automatically.
App Admin

Maintain the access matrix for Organizers and Governance team
Maintain app configuration and changes as need be
Ability to access to all features that governance and organizers have for all events
Monitor logs and app performance
Good to Have
Intelligent suggestions and notifications based on User preferences, interests, participation trends, availability, nature of current work, learning goals, and work load.

App can also act as a News Hub where leaders can post on latest happenings in technology and business. Everyone can express their views. This will help all employees to get a sense of organizations focus, and also their views on current developments.

Existing Solutions/Products
None in Infosys

Reference
Relevance
Org wide

Requirement
Software Required, if any (Mention suggested technologies to be used)
MERN stack and SLM for the AI features

Hardware Required, if any (will need to be funded by the account)
Laptop

How to test (How can the solution be tested and what will be expected in the demo)
It can be easily demonstrated for each persona starting from Admin to the end user.

Input datasets (Problem Owner needs to share the datasets relevant to the problem)
NA
Evaluation Criteria (Add other solution specific parameters that will be measured to judge the solution)
Creativity	How creative or innovative is the idea within the given challenge? Has this been done before, or is this something completely new and original idea (architecture, design and implementation)?	10%	
Innovative Technology & Quality	How you have utilized the existing technologies to their solution and quality of code?	20%	
User experience and functionality	Is the overall user experience intuitive? Does the flow make sense?	10%	
Simplicity	How elegantly does it solve the problem (smart vs harder)?	10%	
Feasibility/Impact/Reuse/Extensibility/ Modularity	Does your solution work? Can it be implemented at scale? Can it be extended to other similar problem statements?	30%	
Progress and Execution	How much is accomplished in a day?	10%	
Demo & Presentation	How well did the team present?	10%	
Feedback Source Donate Terms Privacy @benbalter