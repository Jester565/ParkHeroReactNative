# ParkHeroReactNative
A mobile app which accomplishes many things the Disneyland app does with extra features to increase efficiency, personalization, and content creation.

# Attractions
Ride and event information are automatically kept up-to-date, customizable, and available offline.

### Ride List
The ride list shows <b>real-time</b> ride status, wait times, and FastPass times.
<br/><br/>
Each ride has a color (red for bad, green for good) to represent its <b>wait rating</b> that compares the current wait time to the smart average.  The <b>smart average</b> is the predicted wait time of the ride at a certain time and is generated using a <i>deep neural network</i> whose model is trained with 2 years of previous wait times, FastPass times, weather, blackout, day of week, day of year, etc.
<br/><br/>
Custom <b>filters</b> can contain multiple rides selected by the user.  Multiple filters can be applied to hide rides.
<br/><br/>
<b>Filter watchers</b> allow users to get <i>notifications</i> for rides in a filter when certain criterias are met.  For example, when Space Mountain has a wait less than 30 minutes or has opened after a temporary shutdown, the user will be notified and will beat other users who have to check manually.

### Ride
When a ride is selected from the list, you can view more information and <b>customize</b> it.
<br/><br/>
Users can add multiple of their <b>own pictures</b> to a ride and select a thumbnail (the image shown in the list).  The ride name can also be changed.  Note that all changes the user makes here are backed up and are consistent throughout the entire app.
<br/><br/>
Graphs display the rides previous wait times, smart averages, FastPass times, and predicted FastPass times.  This allows the user to make a more informed decision than by solely looking at the wait rating.

### Time Machine
Previous and <b>predicted ride information</b> can be accessed with the time machine.  Here, you can use a slider or a time picker to <b>select a date</b> and time to view information on.
<br/>
<br/>
<b>Weather, blackouts, and park schedules</b> will also be shown for the selected time.
<br/>
<br/>
In the time picker, black outs and park hours can be easily accessed.

### Events
Along with the ride times, events are customizable and contain <b>event times</b>.

# Users
Although the Disney official app has accounts, users are never able to communicate with eachother.  Instead, its an unecessary barrier to start using features such as MaxPass.  ParkHero accounts are used to <b>connect</b> with others, backup more cutomization, and don't require any information from the user (you never even have to login to a Disney account!).
### Login
<b>An account isn't required</b>. Users can start using the app immediatley and have access to all features.  However, they have the option to <b>create an account with Google or ParkHero</b> if they want to use a different device.

### Profile
Users can modify their <b>profiles</b> to have their own names and profile pictures that are <b>checked for inappropiate content</b>.

### Passes
Park passes can easily be added by <b>scanning the pass code</b> with your Camera.  If a pass code is valid, the pass type, expiration date, and name is aquired.
<br/>
<br/>
A pass list allows you to easily scan into the FastPass line.

### Parties
However, you don't have to remove and add passes everytime you go to the park with different people.  Instead, other <b>users can join your party</b> if you invite them.  Within a party, you can <b>share passes</b> and press a button to <b>split the passes between phones</b> so you can scan into the FastPass line faster.

# MaxPass+
MaxPass is a service offered by Disney where users can order FastPasses from their phone.  This obviously provides a large benefit as users can order FastPasses in a line, eating lunch, etc.  However, after paying $15 a lot of work is still required from the user.  <b>With Disney's offical app, users must manually order a FastPass when the next selection time arrives</b>.  If I'm in the many areas in a park with no service, busy enjoying a roller coaster, or forgot to set up a timer on my phone, I'm not able to order a MaxPass.
<br />
<br />
MaxPass+ enables parties to <b>queue up the FastPasses they want to order</b>.  When the selection time arrives, the FastPass will automatically be ordered, the user will be <b>notified</b>, and the next order will be prepped.  The priority of you FastPass orders can also be specified and a <i>dependency tree</i> will be created to provide <b>predicted FastPass & selection time</b>.
<br />
<br />
If you don't have a MaxPass, ParkHero can still send notifications to <b>remind you when you can order your next FastPass</b>.

# Ride Recognition Editing
In Disney World, magic bands are given to each guest so an RFID signal is emitted wherever they go.  This allowes Disney World to do some cool stuff including creating videos of a guest riding a roller coaster by knowing what car they were in.  However, Disneyland does not provide magic bands and, therefore, has no system to create these videos (I imagine the magic bands are too expensive).  <b>Ride recognition seeks to create edited video of a guest riding a roller coaster without introducing any expensive hardware</b>.
<br />
<br />
Ride Recognition uses <b>acceleration</b> to identity exactly which and what part of the ride a guest is on.  This information is then used to edit any videos taken by the guest during this time with <i>FFmpeg</i>.  Below you can see the first Ride Recognition Edit test.
<br />
<br />
Creating Ride Recognition Edits is relatively simple. A JSON editing recipe is provided that points to video clips and music and easily mixes it in with video of the user riding.  Later on, I hope to provide a more robust edit creation and sharing system.

# WIP
The map is still a work in progress.  Currently, I've written a view to handle the massive image.  However, user location and rides must still be shown.
