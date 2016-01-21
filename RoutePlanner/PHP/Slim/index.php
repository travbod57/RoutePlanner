<?php
/**

 */
require 'Slim/Slim.php';
require 'ResponseDataDtos.php';

require_once('../wp-config.php');
$wp->init(); $wp->parse_request(); $wp->query_posts();
$wp->register_globals(); $wp->send_headers();

require_once('../phpMailer/class.phpmailer.php');
require_once('../phpMailer/class.smtp.php'); // optional, gets called from within class.phpmailer.php if not already loaded
	


\Slim\Slim::registerAutoloader();

/**
 * Step 2: Instantiate a Slim application
 *
 * This example instantiates a Slim application using
 * its default settings. However, you will usually configure
 * your Slim application now by passing an associative array
 * of setting names and values into the application constructor.
 */
 
$logWriter = new \Slim\LogWriter(fopen('C:/wamp/www/wp_thinkbackpacking/Slim/errors_log.txt', 'a'));
$app = new \Slim\Slim(array(
    'debug' => true,
    'log.enabled' => true,
    'log.level' => \Slim\Log::DEBUG,
    'log.writer' => $logWriter
));
//$app->log->INFO($_SERVER["DOCUMENT_ROOT"] . '/wp-blog-header.php');
$env = $app->environment();

/**
 * Step 3: Define the Slim application routes
 *
 * Here we define several Slim application routes that respond
 * to appropriate HTTP request methods. In this example, the second
 * argument for `Slim::get`, `Slim::post`, `Slim::put`, `Slim::patch`, and `Slim::delete`
 * is an anonymous function.
 */

 $app->error(function (\Exception $e) use ($app) {
    echo 'An error occurred';
    $app->log->ERROR($e);
 });
 
 // GET tripNameAlreadyExists
 $app->get('/tripNameAlreadyExists', function () use ($app, $env) {
    
    try
    {
		$tripName = trim(stripslashes($_GET['tripName']));
	
		$userId = get_current_user_id();
		
		$pdo = new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));

		$sql = "SELECT * FROM trip WHERE UserId = :userId AND Name = :tripName AND DeletedDate IS NULL";
		$statement = $pdo->prepare($sql);		
		$statement->bindValue(':userId', $userId, PDO::PARAM_INT);
		$statement->bindValue(':tripName', $tripName, PDO::PARAM_STR);
		$statement->execute();
		
		$result = $statement->rowCount();
		
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/text');
		$response->headers->set('Access-Control-Allow-Origin', '*');
		$response->headers->set('Access-Control-Allow-Methods', 'GET');

		$response->body($result);
     }
     catch (\Exception $e) {
		$app->error($e);
     }
});


// GET isAuthenticated
 $app->get('/isAuthenticated', function () use ($app, $env) {
    
    try
    {
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/text');
		$response->headers->set('Access-Control-Allow-Origin', '*');
		$response->headers->set('Access-Control-Allow-Methods', 'GET, POST');

		$response->body(is_user_logged_in());
		//$response->body(1);
     }
     catch (\Exception $e) {
		$app->error($e);
     }
});

// GET asyncLocations
 $app->get('/getLocationsByTerm', function () use ($app, $env) {
    
    try
    {
		$searchTerm = '%' . $_GET['searchTerm'] . '%';
			
		$pdo = new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));

		$sql = "SELECT * FROM location WHERE Place LIKE :searchTerm LIMIT 0,8";
		$statement = $pdo->prepare($sql);		
		$statement->bindValue(':searchTerm', $searchTerm, PDO::PARAM_STR);
		$statement->execute();
		$results = $statement->fetchAll(PDO::FETCH_ASSOC);

		$json = json_encode($results);
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/json');
		$response->headers->set('Access-Control-Allow-Origin', '*');
		$response->body($json);
     }
     catch (\Exception $e) {
		$app->error($e);
     }
});

// GET getMyTrips
 $app->get('/getMyTrips', function () use ($app, $env) {
    
    try
    {
		$userId = get_current_user_id();

		$pdo = new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		
		$sql = "SELECT T.*, C.Symbol FROM trip T LEFT JOIN currency C ON T.CurrencyID = C.ID WHERE T.UserId = :userId AND T.DeletedDate IS NULL ORDER BY ModifiedDate DESC";
		
		$statement = $pdo->prepare($sql);		
		$statement->bindValue(':userId', $userId, PDO::PARAM_INT);
		$statement->execute();
		$results = $statement->fetchAll(PDO::FETCH_ASSOC);

		$json = json_encode($results);
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/json');
		$response->headers->set('Access-Control-Allow-Origin', '*');
		$response->body($json);
		
		$app->log->INFO("my trips");
     }
     catch (\Exception $e) {
		$app->error($e);
     }
});

// POST delete trip
$app->post(
    '/deleteTrip',
    function () use ($app, $env) {
	
		$pdo = new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		
		$wp_authenticated = is_user_logged_in();
		
		$userId = get_current_user_id();
		$tripId = $_POST['tripId'];
		$deletedDate = $_POST['deletedDate'];
		
		$get_trip_sql = "SELECT T.Id, T.Name, T.StartDate, T.EndDate, T.NumberOfStops, T.NumberOfNights, T.TotalCost, C.Id as CurrencyId, C.Name as turrencyName FROM trip T LEFT JOIN currency C ON C.Id = T.CurrencyId WHERE T.Id = :tripId AND T.UserId = :userId";
		
		$stmt[0] = $pdo->prepare($get_trip_sql);
		$stmt[0]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
		$stmt[0]->bindValue(':userId', $userId, PDO::PARAM_INT);
		$stmt[0]->execute();
		$tripData = $stmt[0]->fetchAll(PDO::FETCH_ASSOC);
		
		$trip_authenticated = !empty($tripData);
		
		if ($wp_authenticated && $trip_authenticated)
		{
			$delete_route_sql = "UPDATE route SET DeletedDate = :deletedDate WHERE TripId = :tripId";
			$delete_trip_sql = "UPDATE trip SET DeletedDate = :deletedDate WHERE Id = :tripId AND UserId = :userId";
			
			$stmt[1] = $pdo->prepare($delete_route_sql);
			$stmt[1]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
			$stmt[1]->bindValue(':deletedDate', date('Y-m-d H:i:s', $deletedDate), PDO::PARAM_STR);
			
			$stmt[2] = $pdo->prepare($delete_trip_sql);
			$stmt[2]->bindValue(':userId', $userId, PDO::PARAM_INT);
			$stmt[2]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
			$stmt[2]->bindValue(':deletedDate', date('Y-m-d H:i:s', $deletedDate), PDO::PARAM_STR);
			
			$app->log->INFO("UserId: " . $userId . ", tripId: " . $tripId);
		
			$pdo->beginTransaction();

			try
			{
				$stmt[1]->execute();    
				$stmt[2]->execute();  

				$pdo->commit();     

				$response = $app->response();
				$response->headers->set('Content-Type', 'application/json');
				$response->headers->set('Access-Control-Allow-Origin', '*');
				$response->body(null);
				
				$app->log->INFO("success");
			}
			catch(PDOException $e)
			{
				$pdo->rollBack();
				$app->error($e);
			}    
		}
		else
		{
			$app->response->setStatus(401);
			$unauthArray = array("Trip_Unauthorised");
			$json = json_encode($unauthArray);
		
			$response = $app->response();
			$response->headers->set('Content-Type', 'application/json');
			$response->headers->set('Access-Control-Allow-Origin', '*');
			$response->body($json);
		}
	}
); 


// POST save trip
$app->post(
    '/saveTrip',
    function () use ($app, $env) {
	
		//date_default_timezone_set('Europe/London');
		$pdo = new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
					
		$trip = json_decode(stripslashes($_POST['tripData']));
		$route = $trip->Route;
		$userId = get_current_user_id();
		
		//$app->log->INFO("tripDataRaw: " . $_POST['tripData']);
		//$app->log->INFO("tripDataSlashes: " . stripslashes($_POST['tripData']));
		//$app->log->INFO("tripDataStripSlashesName: " . $tripDataStripSlashes->Name);
		//$app->log->INFO("tripDataStripSlashesJSONEncodeName: " . $tripDataStripSlashesJSONEncode->Name);
		
		if ($trip->Id == 0 && $trip->SessionStorage == 1) // Save a New Trip from Session Storage from MyTrips page
		{
			$app->log->INFO("new trip from session storage");
			$insert_trip_sql = "INSERT INTO trip (UserId, Name, StartDate, EndDate, NumberOfStops, NumberOfNights, TotalCost, CurrencyId, CreatedDate, ModifiedDate) VALUES (:userId, :name, :startDate, :endDate, :numberOfStops, :numberOfNights, :totalCost, :currencyId, :createdDate, :modifiedDate)";

			$sqlStatementCount = 0;
			$stmt[$sqlStatementCount] = $pdo->prepare($insert_trip_sql);
			$stmt[$sqlStatementCount]->bindValue(':userId', $userId, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':name', $trip->Name, PDO::PARAM_STR);
			$stmt[$sqlStatementCount]->bindValue(':startDate', $trip->StartDate, PDO::PARAM_STR);	
			$stmt[$sqlStatementCount]->bindValue(':endDate', $trip->EndDate, PDO::PARAM_STR);
			$stmt[$sqlStatementCount]->bindValue(':numberOfStops', $trip->NumberOfStops, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':numberOfNights', $trip->NumberOfNights, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':totalCost', $trip->TotalCost);
			$stmt[$sqlStatementCount]->bindValue(':currencyId', $trip->CurrencyId, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':createdDate', date('Y-m-d H:i:s', $trip->CreatedDate), PDO::PARAM_STR);
			$stmt[$sqlStatementCount]->bindValue(':modifiedDate', date('Y-m-d H:i:s', $trip->ModifiedDate), PDO::PARAM_STR);
			
			$pdo->beginTransaction();

			try
			{
				// Insert trip and return the Id of the Trip to use for the route
				$stmt[0]->execute();
				$tripId = $pdo->lastInsertId();
				
				// insert the Route for the Trip using hte Id of the Trip just added
				prepareRoute($pdo, $stmt, $sqlStatementCount, $tripId, $route, date('Y-m-d H:i:s', $trip->ModifiedDate));
				
				$stmtLength = count($stmt);
				
				for ($y = 1; $y < $stmtLength; $y++) {

					$stmt[$y]->execute();
				}

				$pdo->commit();     
				
				$response = $app->response();
				$response->headers->set('Content-Type', 'application/json');
				$response->headers->set('Access-Control-Allow-Origin', '*');
				$response->body($tripId);
			}
			catch(PDOException $e)
			{
				$pdo->rollBack();
				$app->error($e);
			}  
			
	    }
		else if ($trip->Id == 0) // Insert a New Trip from Route Planner page or MyTrips page using button
		{
			$app->log->INFO("new trip");
		
			$insert_trip_sql = "INSERT INTO trip (UserId, Name, CreatedDate, ModifiedDate) VALUES (:userId, :tripName, :createdDate, :modifiedDate)";
			
			$stmt = $pdo->prepare($insert_trip_sql);
			$stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
			$stmt->bindValue(':tripName', $trip->Name, PDO::PARAM_STR);
			$stmt->bindValue(':createdDate', date('Y-m-d H:i:s', $trip->CreatedDate), PDO::PARAM_STR);
			$stmt->bindValue(':modifiedDate', date('Y-m-d H:i:s', $trip->ModifiedDate), PDO::PARAM_STR);
			
			$pdo->beginTransaction();

			try
			{
				$stmt->execute();  
				$tripId = $pdo->lastInsertId();
				
				$pdo->commit();     
				
				$response = $app->response();
				$response->headers->set('Content-Type', 'application/json');
				$response->headers->set('Access-Control-Allow-Origin', '*');
				$response->body($tripId);
			}
			catch(PDOException $e)
			{
				$pdo->rollBack();
				$app->error($e);
			}    
		}
		else // Save Route and Trip on an existing trip
		{
			//$app->log->INFO("Id : " . $trip->Id . "StartDate : " . $trip->StartDate . " EndDate : " . $trip->EndDate . "NumberOfStops : " . $trip->NumberOfStops . "NumberOfNights : " . $trip->NumberOfNights . "CurrencyId : " . $trip->CurrencyId . "ModifiedDate : " . date("Y-m-d H:m:s") . "TotalCost : " . $trip->TotalCost);
			
			$pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );

			$tripId = $trip->Id;
				
			$delete_route_sql = "DELETE FROM route WHERE TripId = :tripId";
			$update_trip_sql = "UPDATE trip SET StartDate = :startDate, EndDate = :endDate, NumberOfStops = :numberOfStops, NumberOfNights = :numberOfNights, TotalCost = :totalCost, CurrencyId = :currencyId, ModifiedDate = :modifiedDate WHERE Id = :tripId";
		
			$sqlStatementCount = 0;
			$stmt[$sqlStatementCount] = $pdo->prepare($delete_route_sql);
			$stmt[$sqlStatementCount]->bindValue(':tripId', $tripId, PDO::PARAM_INT);	
				
			$sqlStatementCount = 1;
			$stmt[$sqlStatementCount] = $pdo->prepare($update_trip_sql);
			$stmt[$sqlStatementCount]->bindValue(':startDate', $trip->StartDate, PDO::PARAM_STR);	
			$stmt[$sqlStatementCount]->bindValue(':endDate', $trip->EndDate, PDO::PARAM_STR);
			$stmt[$sqlStatementCount]->bindValue(':numberOfStops', $trip->NumberOfStops, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':numberOfNights', $trip->NumberOfNights, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':totalCost', $trip->TotalCost);
			$stmt[$sqlStatementCount]->bindValue(':currencyId', $trip->CurrencyId, PDO::PARAM_INT);
			$stmt[$sqlStatementCount]->bindValue(':modifiedDate', date('Y-m-d H:i:s', $trip->ModifiedDate), PDO::PARAM_STR);
			$stmt[$sqlStatementCount]->bindValue(':tripId', $trip->Id, PDO::PARAM_INT);
			
			prepareRoute($pdo, $stmt, $sqlStatementCount, $tripId, $route, date('Y-m-d H:i:s', $trip->ModifiedDate));

			$pdo->beginTransaction();

			try
			{
				$stmtLength = count($stmt);
				
				for ($y = 0; $y < $stmtLength; $y++) {

					$stmt[$y]->execute();
				}

				$pdo->commit();     
				
				$response = $app->response();
				$response->headers->set('Content-Type', 'application/json');
				$response->headers->set('Access-Control-Allow-Origin', '*');
				$response->body($tripId);
			}
			catch(PDOException $e)
			{
				$pdo->rollBack();
				$app->error($e);
			}    
		}
    }
); 

function prepareRoute(&$pdo, &$stmt, $sqlStatementCount, $tripId, $route, $dateTimeNow) {

	$routeLength = count($route);
	$add_route_sql = "INSERT INTO route (TripId, LocationId, StopNumber, Nights, DailyCost, TotalCost, TransportId, CreatedDate) VALUES (:tripId, :locationId, :stopNumber, :nights, :dailyCost, :totalCost, :transportId, :createdDate)";
	
	for ($x = 0; $x < $routeLength; $x++) {
				
		$sqlStatementCount++;
		
		foreach($route[$x] as $routeKey => $routeValue) {
				
			if ($routeKey == "location")
			{
				foreach($routeValue as $locationKey => $locationValue)
				{
					if ($locationKey == "Id")
						$locationId = $locationValue;
				}
			}
			else
			{
				if ($routeKey == "stop")
					$stopNumber = ++$stopNumberInc;
				else if ($routeKey == "nights")
					$nights = $routeValue;
				else if ($routeKey == "dailyCost")
					$dailyCost = $routeValue;
				else if ($routeKey == "totalCost")
					$totalCost = $routeValue;
				else if ($routeKey == "transportId")
					$transportId = $routeValue;
			}
		}
		
		//$app->log->INFO("tripId: " . $tripId . "locationId: " . $locationId . "stopNumber: " . $stopNumber . "nights: "  . $nights . "totalCost:" . $totalCost . "transportId: " . $transportId);
		
		$stmt[$sqlStatementCount] = $pdo->prepare($add_route_sql);
		
		$stmt[$sqlStatementCount]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
		$stmt[$sqlStatementCount]->bindValue(':locationId', $locationId, PDO::PARAM_INT);
		$stmt[$sqlStatementCount]->bindValue(':stopNumber', $stopNumber, PDO::PARAM_INT);
		$stmt[$sqlStatementCount]->bindValue(':nights', $nights, PDO::PARAM_INT);
		$stmt[$sqlStatementCount]->bindValue(':dailyCost', $dailyCost);
		$stmt[$sqlStatementCount]->bindValue(':totalCost', $totalCost);
		$stmt[$sqlStatementCount]->bindValue(':transportId', $transportId, PDO::PARAM_INT);	
		$stmt[$sqlStatementCount]->bindValue(':createdDate', $dateTimeNow, PDO::PARAM_STR);
	}
}


// Get Trip
 $app->get('/getTrip', function () use ($app, $env) {
		
		$wp_authenticated = is_user_logged_in();
		
		$userId = get_current_user_id();
		$tripId = $_GET['tripId'];
		

		$pdo=new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		$pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
			
		$get_trip_sql = "SELECT T.Id, T.Name, T.StartDate, T.EndDate, T.NumberOfStops, T.NumberOfNights, T.TotalCost, C.Id as CurrencyId, C.Name as CurrencyName FROM trip T LEFT JOIN currency C ON C.Id = T.CurrencyId WHERE T.Id = :tripId AND T.UserId = :userId";
		
		$stmt[0] = $pdo->prepare($get_trip_sql);
		$stmt[0]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
		$stmt[0]->bindValue(':userId', $userId, PDO::PARAM_INT);
		$stmt[0]->execute();
		$tripData = $stmt[0]->fetchAll(PDO::FETCH_ASSOC);
		
		$trip_authenticated = !empty($tripData);
		
		if ($wp_authenticated && $trip_authenticated) 
		{
			$get_route_sql = "SELECT R.Id as RouteId, R.StopNumber, R.Nights, R.DailyCost, R.TotalCost,
			L.Id, L.Place, L.Country, L.Full_Name, L.DailyCost as LocationDailyCost, L.Latitude, L.Longitude, L.IsAirport, T.Id as TransportId, T.Name as TransportName
			FROM route R JOIN location L ON L.Id = R.LocationId JOIN transport T ON T.Id = R.TransportId WHERE R.TripId = :tripId ORDER BY StopNumber ASC";

			$stmt[1] = $pdo->prepare($get_route_sql);
			$stmt[1]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
			$stmt[1]->execute();
			$routeData = $stmt[1]->fetchAll(PDO::FETCH_ASSOC);
			
			$routeDataArray = Array();
			$routeDataCount = $stmt[1]->rowCount();
			
			foreach ($routeData as $row)
			{
				array_push($routeDataArray, new Route($row, $routeDataCount));
			}
			
			$tripResult = new TripResult();
			$tripResult->Trip = new Trip($tripData[0]);
			$tripResult->Route = $routeDataArray;
			$tripResult->PolyLines = null;
			
			$json = json_encode($tripResult);
		}
		else if (!$wp_authenticated && $tripId != "")
		{
			$app->response->setStatus(401);
			$unauthArray = array("WP_Unauthorised");
			$json = json_encode($unauthArray);
		}
		else if ($tripId == "")
		{
			$app->response->setStatus(401);
			$unauthArray = array("TripId_Not_Provided");
			$json = json_encode($unauthArray);
		}
		else if (!$trip_authenticated)
		{
			$app->response->setStatus(401);
			$unauthArray = array("Trip_Unauthorised");
			$json = json_encode($unauthArray);
		}
		
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/json');
		$response->headers->set('Access-Control-Allow-Origin', '*');
		$response->body($json);
    }
); 

// POST sendEmail
$app->post(
    '/sendEmail',
    function () use ($app, $env) {

    try
    {

	
		// receive data - JSON, email address
		//$json = '[ { "id": "1", "location": { "Id": "1", "Name": "USA", "DailyCost": "20.00", "Latitude": "1.00000000", "Longitude": "-1.00000000" }, "coords": { //"latitude": "1.00000000", "longitude": "-1.00000000" }, "nights": 0, "transport": "Air", "totalCost": 0, "stop": 1 }, { "id": "533", "location": { "Id": "533", //"Name": "London, United Kingdom", "DailyCost": "0.00", "Latitude": "51.50000000", "Longitude": "-0.08333300" }, "coords": { "latitude": "51.50000000", //"longitude": "-0.08333300" }, "nights": 0, "transport": "Air", "totalCost": 0, "stop": 2 }, { "id": "310", "location": { "Id": "310", "Name": "Canberra, //Australia", "DailyCost": "0.00", "Latitude": "-35.26666641", "Longitude": "100.00000000" }, "coords": { "latitude": "-35.26666641", "longitude": "100.00000000" }, //"nights": 0, "transport": "Air", "totalCost": 0, "stop": 3 }, { "id": "388", "location": { "Id": "388", "Name": "Paris, France", "DailyCost": "0.00", "Latitude": //"48.86666489", "Longitude": "2.33333302" }, "coords": { "latitude": "48.86666489", "longitude": "2.33333302" }, "nights": 0, "transport": "Air", "totalCost": 0, //"stop": 4 } ]';
		
		$emailAddress = $_POST['address'];
		$bccAddress = "alexwilliams57@hotmail.com";
		$json = $_POST['routeData'];
		
		date_default_timezone_set('Europe/London');
		//$app->log->info("INFO - an email was sent to: " . $emailAddress . ", at: " . date("Y-m-d H:m:s"));
		
		// decode JSON
		
		$arrRoute = json_decode(stripslashes($json));
		$arrRouteLength = count($arrRoute);
		
		// get transport options
		
		$get_transport_sql = "SELECT Id, Name FROM transport";
			
		$pdo=new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		$pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
		
		$stmt[0] = $pdo->prepare($get_transport_sql);
		$stmt[0]->execute();
		$transportData = $stmt[0]->fetchAll(PDO::FETCH_ASSOC);
	
		//create HTML email
		
		$html = "<html><head><style>table, p { font-family: 'Arial', Helvetica, sans-serif; font-size: 0.8em; }
		th, td { text-align: left; padding: 5px; }
		th { font-weight: bold; border-bottom: 1px; }
		tbody tr:nth-child(odd){ background-color:#f9f9f9; }
		</style></head><body>";
		
		$html .= "<p>Dear backpacker,</p><p>Thank you for planning your world travel experience with Thinkbackpacking.com!</p><table><thead><th>Stop</th>		      <th>Location</th><th>Nights</th><th>Daily Cost</th><th>Total Cost</th><th>Leave By</th></thead><tbody>";
		
		for ($x = 0; $x < $arrRouteLength; $x++) {
			
			$html .= "<tr>";
			
			foreach($arrRoute[$x] as $routeKey => $routeValue) {
				
				if ($routeKey == "location")
				{
					foreach($routeValue as $locationKey => $locationValue)
					{
						if ($locationKey == "Id")
							$locationId = $locationValue;
						if ($locationKey == "Full_Name")
							$locationName = $locationValue;
					}
				}
				else
				{
					if ($routeKey == "dailyCost")
						$dailyCost = $routeValue;
					if ($routeKey == "stop")
						$stopNumber = $routeValue;
					else if ($routeKey == "nights")
						$nights = $routeValue;
					else if ($routeKey == "totalCost")
						$totalCost = $routeValue;
					else if ($routeKey == "transportId")
						$transportId = $routeValue;
				}
			}
			
			$html .= "<td>" . $stopNumber . "</td><td>" . $locationName . "</td><td>" . $nights . "</td><td>" . $dailyCost . "</td><td>" . ((empty($totalCost)) ? "0.00" : $totalCost) . "</td> 	<td>" . $transportData[$transportId-1]['Name'] . "</td>";
			$html .= "</tr>";
		}
		
		$html .= "</tbody></table><br/><p>Happy trails</p></body></html>";
		
		// Send Email
		
		$mail = new PHPMailer(); // create a new object
		$mail->IsSMTP(); // enable SMTP
		$mail->SMTPDebug = 1; // debugging: 1 = errors and messages, 2 = messages only
		$mail->SMTPAuth = true; // authentication enabled
		$mail->SMTPSecure = 'ssl'; // secure transfer enabled REQUIRED for GMail
		$mail->Port = 465; // or 587
		$mail->IsHTML(true);
		//$mail->Host = "smtp.gmail.com";
		//$mail->Username = "alexjwilliams57@gmail.com";
		//$mail->Password = "eae.b-hJ";
		$mail->Host = "thinkbackpacking.com";
		$mail->Username = "travel@thinkbackpacking.com";
		$mail->Password = "Dinosaur89";
		$mail->SetFrom("travel@thinkbackpacking.com", 'thinkbackpacking');
		$mail->Subject = "Your trip";
		$mail->Body = "$html";
		$mail->AddAddress($emailAddress);
		$mail->AddBCC($bccAddress);
		
		if(!$mail->Send())
		{
			echo "Mailer Error: " . $mail->ErrorInfo;
		}
		else
		{
			echo "Message has been sent";
		}
		
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/json');
		$response->headers->set('Access-Control-Allow-Origin', '*');

     }
     catch (\Exception $e) {
		$app->error($e);
     }
    }
); 


// POST route
$app->post(
    '/contactUs',
    function () use ($app) {
		
	try
	{		
		require_once('../phpMailer/class.phpmailer.php');
		require_once('../phpMailer/class.smtp.php'); // optional, gets called from within class.phpmailer.php if not already loaded
		
		$name = $_POST['Name'];
		$message = $_POST['Message'];
		$email = $_POST['Email'];
		
		$to = "contact@thinkbackpacking.com";
		$bccAddress = "alexwilliams57@hotmail.com";

		//create HTML email
		
		$html = "<html><body>";
		$html .= "<p>Name: <strong>" . $name ."</strong></p><p>Email: <strong>" . $email . "</strong></p><p>" . $message . "</p>";
		$html .= "</body></html>";
		
		echo $html;
		
		// Send Email
		
		$mail = new PHPMailer(); // create a new object
		$mail->IsSMTP(); // enable SMTP
		$mail->SMTPDebug = 1; // debugging: 1 = errors and messages, 2 = messages only
		$mail->SMTPAuth = true; // authentication enabled
		$mail->SMTPSecure = 'ssl'; // secure transfer enabled REQUIRED for GMail
		$mail->Port = 465; // or 587
		$mail->IsHTML(true);
		//$mail->Host = "smtp.gmail.com";
		//$mail->Username = "alexjwilliams57@gmail.com";
		//$mail->Password = "eae.b-hJ";
		$mail->Host = "thinkbackpacking.com";
		$mail->Username = "alex@thinkbackpacking.com";
		$mail->Password = "Dinosaur89";
		$mail->AddReplyTo($email, $name);
		$mail->SetFrom("contact@thinkbackpacking.com", 'thinkbackpacking');
		$mail->Subject = "Contact from " . $name;
		$mail->Body = "$html";
		$mail->AddAddress($to);
        $mail->AddBCC($bccAddress);
		
		if(!$mail->Send())
			echo "Mailer Error: " . $mail->ErrorInfo;
		else
			echo "Message has been sent";
	
		$response = $app->response();
		$response->headers->set('Content-Type', 'application/json');
		$response->headers->set('Access-Control-Allow-Origin', '*');

	    }
	    catch (\Exception $e) {
			$app->error($e);
	    }
    }
); 


/**
 * Step 4: Run the Slim application
 *
 * This method should be called last. This executes the Slim application
 * and returns the HTTP response to the HTTP client.
 */
$app->run();

?>
