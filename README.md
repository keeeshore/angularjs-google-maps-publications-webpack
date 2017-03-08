# angularjs-google-maps-publications
AngularJs with google maps and news publication selection list based on selected area in map.
Demo URL: https://keeeshore.github.io/angularjs-google-maps-publications-webpack/

# Pre requisites
1. NodeJs must be installed.
2. Git must be installed.



# Installation
1. Git clone to any directory other than 'desktop'.
2. Go to root folder and using command prompt or git bash. Do 'npm install'
3. After npm install of dependencies, Run the app using npm start.
4. Go to  http://localhost:8080/

# About 
The application is in angularJs (> ver 1.4).
The map is wrapped in a single module called 'mapApp'. (refer main.js)
the 'mapApp' has the following structure.

1. MapController controller -> optional controller 
2. mapService services -> Handler for all inter component/directive communication
2. mapComponent component -> main component with 2 child directives (as below)
3. mapArea directictive -> placeholder for the google map to load.
4. publicationList directive -> Holds all the publication list.
