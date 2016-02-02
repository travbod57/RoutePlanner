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
	
		$wp_authenticated = is_user_logged_in();
		
		if ($wp_authenticated)
		{
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
		else
		{
			$app->response->setStatus(401);
			$unauthArray = array("User_Unauthorised");
			$json = json_encode($unauthArray);
		
			$response = $app->response();
			$response->headers->set('Content-Type', 'application/json');
			$response->headers->set('Access-Control-Allow-Origin', '*');
			$response->body($json);
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
		$token = $_GET['token'];

		$pdo=new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
		$pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
			
		$get_trip_sql = "SELECT T.Id, T.Name, T.StartDate, T.EndDate, T.NumberOfStops, T.NumberOfNights, T.TotalCost, C.Id as CurrencyId, C.Name as CurrencyName FROM trip T LEFT JOIN currency C ON C.Id = T.CurrencyId WHERE T.Id = :tripId AND (T.UserId = :userId OR 1 = (SELECT COUNT(1) FROM accesstoken WHERE TripId = :tripId AND Token = :token))";
		
		$stmt[0] = $pdo->prepare($get_trip_sql);
		$stmt[0]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
		$stmt[0]->bindValue(':userId', $userId, PDO::PARAM_INT);
		$stmt[0]->bindValue(':token', $token, PDO::PARAM_STR);
		
		$stmt[0]->execute();
		$tripData = $stmt[0]->fetchAll(PDO::FETCH_ASSOC);
		
		$trip_authenticated = !empty($tripData);

		// access to trip data allowed if trip data returned so Authenticated with a WP UserId or supplied a valid Trip Token
		if ($trip_authenticated) 
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
		} // not authorised to WP but tried to enter a Trip Id into the URL
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

// POST shareRoute
$app->post(
    '/shareRoute',
    function () use ($app, $env) {

		$wp_authenticated = is_user_logged_in();
		
		if ($wp_authenticated)
		{
			global $current_user;
			get_currentuserinfo();
			
			$tripId = $_POST['tripId'];
			$userId = get_current_user_id();
			
			$currentUserName = $current_user->user_firstname . " " . $current_user->user_lastname;

			$emailAddress = $_POST['address'];
			$recipientName = $_POST['name'];
			$bccAddress = "alexwilliams57@hotmail.com";

			$accessGUID = getGUID();
			
			$pdo=new PDO($env['DB_Name'],$env['DB_Username'],$env['DB_Password'], array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));
			$pdo->setAttribute( PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION );
			
			$get_trip_sql = "SELECT T.Id, T.Name, T.StartDate, T.EndDate, T.NumberOfStops, T.NumberOfNights, T.TotalCost, C.Id as CurrencyId, C.Name as CurrencyName, C.Symbol as CurrencySymbol FROM trip T LEFT JOIN currency C ON C.Id = T.CurrencyId WHERE T.Id = :tripId AND T.UserId = :userId";
			
			$stmt[0] = $pdo->prepare($get_trip_sql);
			$stmt[0]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
			$stmt[0]->bindValue(':userId', $userId, PDO::PARAM_INT);
			
			$get_route_sql = "SELECT R.Id as RouteId, R.StopNumber, R.Nights, R.DailyCost, R.TotalCost,
			L.Id, L.Place, L.Country, L.Full_Name, L.DailyCost as LocationDailyCost, L.Latitude, L.Longitude, L.IsAirport, T.Id as TransportId, T.Name as TransportName
			FROM route R JOIN location L ON L.Id = R.LocationId JOIN transport T ON T.Id = R.TransportId WHERE R.TripId = :tripId ORDER BY StopNumber ASC";

			$stmt[1] = $pdo->prepare($get_route_sql);
			$stmt[1]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
						
			$insert_access_token_sql = "INSERT INTO accesstoken (TripId, Token, ExpiryDate) VALUES (:tripId, :token, :expiryDate)";
			
			$stmt[2] = $pdo->prepare($insert_access_token_sql);
			$stmt[2]->bindValue(':tripId', $tripId, PDO::PARAM_INT);
			$stmt[2]->bindValue(':token', $accessGUID, PDO::PARAM_STR);
			$stmt[2]->bindValue(':expiryDate', date("Y-m-d H:i:s", strtotime('+48 hours')), PDO::PARAM_STR);	
					
			$pdo->beginTransaction();

			try
			{
				$stmt[0]->execute();
				$tripData = $stmt[0]->fetchAll(PDO::FETCH_ASSOC);
				
				$stmt[1]->execute();
				$routeData = $stmt[1]->fetchAll(PDO::FETCH_ASSOC);
				
				$stmt[2]->execute();  
				
				$pdo->commit();
				
				// create Text email

				foreach ($tripData as $row)
				{		
					$tripName = $row['Name'];
					$startDate = date('jS M Y', strtotime($row['StartDate']));
					$endDate = date('jS M Y', strtotime($$row['EndDate']));
					$currencySymbol = $row['CurrencySymbol'];
					$totalCost = $row['TotalCost'];
				}
				
				$text .= $tripName . "\r\n\r\n";
				$text .= "Dear " . $recipientName . ",\r\n\r\n";
				$text .= $currentUserName . " has chosen to share their trip with you. To view this trip please click on the link below. Your access will expire in 48 hours from receipt of this email.\r\n\r\n";
				$text .= "Please consider visiting Thinkbackpacking.com for all your future adventures.\r\n\r\n";
				$text .= "Happy trails!\r\n\r\n";
				$text .= "Click this link to view the trip: " . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map?tripId=" . $tripId . "&token=" . $accessGUID . "\r\n\r\n";
				$text .= "Click this link to create your own trip: " . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map";
				
				//create HTML email
				
				$html = "<!doctype html> <html xmlns='http://www.w3.org/1999/xhtml' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'> <head> <!-- NAME: 1 COLUMN --> <!--[if gte mso 15]> <xml> <o:OfficeDocumentSettings> <o:AllowPNG/> <o:PixelsPerInch>96</o:PixelsPerInch> </o:OfficeDocumentSettings> </xml> <![endif]--> <meta charset='UTF-8'> <meta http-equiv='X-UA-Compatible' content='IE=edge'> <meta name='viewport' content='width=device-width, initial-scale=1'> <title>*|MC:SUBJECT|*</title> <style type='text/css'> p{ margin:10px 0; padding:0; } table{ border-collapse:collapse; } h1,h2,h3,h4,h5,h6{ display:block; margin:0; padding:0; } img,a img{ border:0; height:auto; outline:none; text-decoration:none; } body,#bodyTable,#bodyCell{ height:100%; margin:0; padding:0; width:100%; } #outlook a{ padding:0; } img{ -ms-interpolation-mode:bicubic; } table{ mso-table-lspace:0pt; mso-table-rspace:0pt; } .ReadMsgBody{ width:100%; } .ExternalClass{ width:100%; } p,a,li,td,blockquote{ mso-line-height-rule:exactly; } a[href^=tel],a[href^=sms]{ color:inherit; cursor:default; text-decoration:none; } p,a,li,td,body,table,blockquote{ -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%; } .ExternalClass,.ExternalClass p,.ExternalClass td,.ExternalClass div,.ExternalClass span,.ExternalClass font{ line-height:100%; } a[x-apple-data-detectors]{ color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; } #bodyCell{ padding:10px; } .templateContainer{ max-width:600px !important; } a.mcnButton{ display:block; } .mcnImage{ vertical-align:bottom; } .mcnTextContent{ word-break:break-word; } .mcnTextContent img{ height:auto !important; } .mcnDividerBlock{ table-layout:fixed !important; } /* @tab Page @section Background Style @tip Set the background color and top border for your email. You may want to choose colors that match your company's branding. */ body,#bodyTable{ /*@editable*/background-color:#FAFAFA; } /* @tab Page @section Background Style @tip Set the background color and top border for your email. You may want to choose colors that match your company's branding. */ #bodyCell{ /*@editable*/border-top:0; } /* @tab Page @section Email Border @tip Set the border for your email. */ .templateContainer{ /*@editable*/border:0; } /* @tab Page @section Heading 1 @tip Set the styling for all first-level headings in your emails. These should be the largest of your headings. @style heading 1 */ h1{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:26px; /*@editable*/font-style:normal; /*@editable*/font-weight:bold; /*@editable*/line-height:125%; /*@editable*/letter-spacing:normal; /*@editable*/text-align:left; } /* @tab Page @section Heading 2 @tip Set the styling for all second-level headings in your emails. @style heading 2 */ h2{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:22px; /*@editable*/font-style:normal; /*@editable*/font-weight:bold; /*@editable*/line-height:125%; /*@editable*/letter-spacing:normal; /*@editable*/text-align:left; } /* @tab Page @section Heading 3 @tip Set the styling for all third-level headings in your emails. @style heading 3 */ h3{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:20px; /*@editable*/font-style:normal; /*@editable*/font-weight:bold; /*@editable*/line-height:125%; /*@editable*/letter-spacing:normal; /*@editable*/text-align:left; } /* @tab Page @section Heading 4 @tip Set the styling for all fourth-level headings in your emails. These should be the smallest of your headings. @style heading 4 */ h4{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:18px; /*@editable*/font-style:normal; /*@editable*/font-weight:bold; /*@editable*/line-height:125%; /*@editable*/letter-spacing:normal; /*@editable*/text-align:left; } /* @tab Preheader @section Preheader Style @tip Set the background color and borders for your email's preheader area. */ #templatePreheader{ /*@editable*/background-color:#FAFAFA; /*@editable*/border-top:0; /*@editable*/border-bottom:0; /*@editable*/padding-top:9px; /*@editable*/padding-bottom:9px; } /* @tab Preheader @section Preheader Text @tip Set the styling for your email's preheader text. Choose a size and color that is easy to read. */ #templatePreheader .mcnTextContent,#templatePreheader .mcnTextContent p{ /*@editable*/color:#656565; /*@editable*/font-family:Helvetica; /*@editable*/font-size:12px; /*@editable*/line-height:150%; /*@editable*/text-align:left; } /* @tab Preheader @section Preheader Link @tip Set the styling for your email's preheader links. Choose a color that helps them stand out from your text. */ #templatePreheader .mcnTextContent a,#templatePreheader .mcnTextContent p a{ /*@editable*/color:#656565; /*@editable*/font-weight:normal; /*@editable*/text-decoration:underline; } /* @tab Header @section Header Style @tip Set the background color and borders for your email's header area. */ #templateHeader{ /*@editable*/background-color:#FFFFFF; /*@editable*/border-top:0; /*@editable*/border-bottom:0; /*@editable*/padding-top:9px; /*@editable*/padding-bottom:0; } /* @tab Header @section Header Text @tip Set the styling for your email's header text. Choose a size and color that is easy to read. */ #templateHeader .mcnTextContent,#templateHeader .mcnTextContent p{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:16px; /*@editable*/line-height:150%; /*@editable*/text-align:left; } /* @tab Header @section Header Link @tip Set the styling for your email's header links. Choose a color that helps them stand out from your text. */ #templateHeader .mcnTextContent a,#templateHeader .mcnTextContent p a{ /*@editable*/color:#2BAADF; /*@editable*/font-weight:normal; /*@editable*/text-decoration:underline; } /* @tab Body @section Body Style @tip Set the background color and borders for your email's body area. */ #templateBody{ /*@editable*/background-color:#FFFFFF; /*@editable*/border-top:0; /*@editable*/border-bottom:2px solid #EAEAEA; /*@editable*/padding-top:0; /*@editable*/padding-bottom:9px; } /* @tab Body @section Body Text @tip Set the styling for your email's body text. Choose a size and color that is easy to read. */ #templateBody .mcnTextContent,#templateBody .mcnTextContent p{ /*@editable*/color:#202020; /*@editable*/font-family:Helvetica; /*@editable*/font-size:16px; /*@editable*/line-height:150%; /*@editable*/text-align:left; } /* @tab Body @section Body Link @tip Set the styling for your email's body links. Choose a color that helps them stand out from your text. */ #templateBody .mcnTextContent a,#templateBody .mcnTextContent p a{ /*@editable*/color:#2BAADF; /*@editable*/font-weight:normal; /*@editable*/text-decoration:underline; } /* @tab Footer @section Footer Style @tip Set the background color and borders for your email's footer area. */ #templateFooter{ /*@editable*/background-color:#FAFAFA; /*@editable*/border-top:0; /*@editable*/border-bottom:0; /*@editable*/padding-top:9px; /*@editable*/padding-bottom:9px; } /* @tab Footer @section Footer Text @tip Set the styling for your email's footer text. Choose a size and color that is easy to read. */ #templateFooter .mcnTextContent,#templateFooter .mcnTextContent p{ /*@editable*/color:#656565; /*@editable*/font-family:Helvetica; /*@editable*/font-size:12px; /*@editable*/line-height:150%; /*@editable*/text-align:center; } /* @tab Footer @section Footer Link @tip Set the styling for your email's footer links. Choose a color that helps them stand out from your text. */ #templateFooter .mcnTextContent a,#templateFooter .mcnTextContent p a{ /*@editable*/color:#656565; /*@editable*/font-weight:normal; /*@editable*/text-decoration:underline; } @media only screen and (min-width:768px){ .templateContainer{ width:600px !important; } }	@media only screen and (max-width: 480px){ body,table,td,p,a,li,blockquote{ -webkit-text-size-adjust:none !important; } }	@media only screen and (max-width: 480px){ body{ width:100% !important; min-width:100% !important; } }	@media only screen and (max-width: 480px){ #bodyCell{ padding-top:10px !important; } }	@media only screen and (max-width: 480px){ .mcnImage{ width:100% !important; } }	@media only screen and (max-width: 480px){ .mcnCaptionTopContent,.mcnCaptionBottomContent,.mcnTextContentContainer,.mcnBoxedTextContentContainer,.mcnImageGroupContentContainer,.mcnCaptionLeftTextContentContainer,.mcnCaptionRightTextContentContainer,.mcnCaptionLeftImageContentContainer,.mcnCaptionRightImageContentContainer,.mcnImageCardLeftTextContentContainer,.mcnImageCardRightTextContentContainer{ max-width:100% !important; width:100% !important; } }	@media only screen and (max-width: 480px){ .mcnBoxedTextContentContainer{ min-width:100% !important; } }	@media only screen and (max-width: 480px){ .mcnImageGroupContent{ padding:9px !important; } }	@media only screen and (max-width: 480px){ .mcnCaptionLeftContentOuter .mcnTextContent,.mcnCaptionRightContentOuter .mcnTextContent{ padding-top:9px !important; } }	@media only screen and (max-width: 480px){ .mcnImageCardTopImageContent,.mcnCaptionBlockInner .mcnCaptionTopContent:last-child .mcnTextContent{ padding-top:18px !important; } }	@media only screen and (max-width: 480px){ .mcnImageCardBottomImageContent{ padding-bottom:9px !important; } }	@media only screen and (max-width: 480px){ .mcnImageGroupBlockInner{ padding-top:0 !important; padding-bottom:0 !important; } }	@media only screen and (max-width: 480px){ .mcnImageGroupBlockOuter{ padding-top:9px !important; padding-bottom:9px !important; } }	@media only screen and (max-width: 480px){ .mcnTextContent,.mcnBoxedTextContentColumn{ padding-right:18px !important; padding-left:18px !important; } }	@media only screen and (max-width: 480px){ .mcnImageCardLeftImageContent,.mcnImageCardRightImageContent{ padding-right:18px !important; padding-bottom:0 !important; padding-left:18px !important; } }	@media only screen and (max-width: 480px){ .mcpreview-image-uploader{ display:none !important; width:100% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Heading 1 @tip Make the first-level headings larger in size for better readability on small screens. */ h1{ /*@editable*/font-size:22px !important; /*@editable*/line-height:125% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Heading 2 @tip Make the second-level headings larger in size for better readability on small screens. */ h2{ /*@editable*/font-size:20px !important; /*@editable*/line-height:125% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Heading 3 @tip Make the third-level headings larger in size for better readability on small screens. */ h3{ /*@editable*/font-size:18px !important; /*@editable*/line-height:125% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Heading 4 @tip Make the fourth-level headings larger in size for better readability on small screens. */ h4{ /*@editable*/font-size:16px !important; /*@editable*/line-height:150% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Boxed Text @tip Make the boxed text larger in size for better readability on small screens. We recommend a font size of at least 16px. */ .mcnBoxedTextContentContainer .mcnTextContent,.mcnBoxedTextContentContainer .mcnTextContent p{ /*@editable*/font-size:14px !important; /*@editable*/line-height:150% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Preheader Visibility @tip Set the visibility of the email's preheader on small screens. You can hide it to save space. */ #templatePreheader{ /*@editable*/display:block !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Preheader Text @tip Make the preheader text larger in size for better readability on small screens. */ #templatePreheader .mcnTextContent,#templatePreheader .mcnTextContent p{ /*@editable*/font-size:14px !important; /*@editable*/line-height:150% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Header Text @tip Make the header text larger in size for better readability on small screens. */ #templateHeader .mcnTextContent,#templateHeader .mcnTextContent p{ /*@editable*/font-size:16px !important; /*@editable*/line-height:150% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Body Text @tip Make the body text larger in size for better readability on small screens. We recommend a font size of at least 16px. */ #templateBody .mcnTextContent,#templateBody .mcnTextContent p{ /*@editable*/font-size:16px !important; /*@editable*/line-height:150% !important; } }	@media only screen and (max-width: 480px){ /* @tab Mobile Styles @section Footer Text @tip Make the footer content text larger in size for better readability on small screens. */ #templateFooter .mcnTextContent,#templateFooter .mcnTextContent p{ /*@editable*/font-size:14px !important; /*@editable*/line-height:150% !important; } }</style></head>";

				$html .= "<body>
								<center>
									<table align='center' border='0' cellpadding='0' cellspacing='0' height='100%' width='100%' id='bodyTable'>
										<tr>
											<td align='center' valign='top' id='bodyCell'>
												<!-- BEGIN TEMPLATE // -->
												<!--[if gte mso 9]>
												<table align='center' border='0' cellspacing='0' cellpadding='0' width='600' style='width:600px;'>
													<tr>
														<td align='center' valign='top' width='600' style='width:600px;'>
														<![endif]-->
															<table border='0' cellpadding='0' cellspacing='0' width='100%' class='templateContainer'>
																<tr>
																	<td valign='top' id='templatePreheader'><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='min-width:100%;'>
																		<tbody class='mcnTextBlockOuter'>
																			<tr>
																				<td valign='top' class='mcnTextBlockInner'>
																		
																					<table align='right' border='0' cellpadding='0' cellspacing='0' width='197' class='mcnTextContentContainer'>
																						<tbody><tr>
																							
																							<td valign='top' class='mcnTextContent' style='padding-top:9px; padding-right:18px; padding-bottom:9px; padding-left:18px;'>
																							
																								
																							</td>
																						</tr>
																					</tbody></table>
																					
																				</td>
																			</tr>
																		</tbody>
																	</table></td>
																</tr>
																<tr>
																	<td valign='top' id='templateHeader'>
																		<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnImageBlock' style='min-width:100%;'>
																			<tbody class='mcnImageBlockOuter'>
																					<tr>
																						<td valign='top' style='padding:9px' class='mcnImageBlockInner'>
																							<table align='left' width='100%' border='0' cellpadding='0' cellspacing='0' class='mcnImageContentContainer' style='min-width:100%;'>
																								<tbody><tr>
																									<td class='mcnImageContent' valign='top' style='padding-right: 9px; padding-left: 9px; padding-top: 0; padding-bottom: 0; text-align:center;'>
																										
																											
																												<img align='center' alt='' src='" . $env['SiteURL']. "/wp-content/themes/devdmbootstrap3-child/images/title-inverse.png' width='478' style='max-width:478px; padding-bottom: 0; display: inline !important; vertical-align: bottom;' class='mcnImage'>
																											
																										
																									</td>
																								</tr>
																							</tbody></table>
																						</td>
																					</tr>
																			</tbody>
																		</table>
																	</td>
																</tr>
																<tr>
																	<td valign='top' id='templateBody'>
																		<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='min-width:100%;'>
																			<tbody class='mcnTextBlockOuter'>
																				<tr>
																					<td valign='top' class='mcnTextBlockInner'>
																						
																						<table align='left' border='0' cellpadding='0' cellspacing='0' width='100%' style='min-width:100%;' class='mcnTextContentContainer'>
																							<tbody><tr>
																								
																								<td valign='top' class='mcnTextContent' style='padding-top:9px; padding-right: 18px; padding-bottom: 9px; padding-left: 18px;'>
																									<br>
																									<h1>". $tripName . "</h1>
																									<br>
																									
																									<p>Dear " . $recipientName . ",</p>

																									<p>" . $currentUserName . " has chosen to share their trip with you. To view this trip please click on the button below. Your access will expire in 48 hours from receipt of this email.</p>

																									<p>Perhaps you would also like to <a href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map'>create a trip</a> with Thinkbackpacking.com.<br>
																									<br>
																									Happy trails!</p>
																									<br>
																								</td>
																							</tr>
																						</tbody></table>
																						
																					</td>
																				</tr>
																			</tbody>
																		</table><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnButtonBlock' style='min-width:100%;'>
																			<tbody class='mcnButtonBlockOuter'>
																				<tr>
																					<td style='padding-top:0; padding-right:18px; padding-bottom:18px; padding-left:18px;' valign='top' align='center' class='mcnButtonBlockInner'>
																						<table border='0' cellpadding='0' cellspacing='0' class='mcnButtonContentContainer' style='border-collapse: separate !important;border-radius: 3px;background-color: #4EAACC;'>
																							<tbody>
																								<tr>
																									<td align='center' valign='middle' class='mcnButtonContent' style='font-family: Arial; font-size: 16px; padding: 15px;'>
																										<a class='mcnButton ' title='View trip' href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map?tripId=" . $tripId . "&token=" . $accessGUID . "' target='_blank' style='font-weight: bold;letter-spacing: normal;line-height: 100%;text-align: center;text-decoration: none;color: #FFFFFF;'>View trip</a>
																									</td>
																								</tr>
																							</tbody>
																						</table>
																					</td>
																				</tr>
																			</tbody>
																		</table>
																	</td>
																</tr>
																<tr>
																	<td valign='top' id='templateFooter'>
																		<table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnDividerBlock' style='min-width:100%;'>
																			<tbody class='mcnDividerBlockOuter'>
																				<tr>
																					<td class='mcnDividerBlockInner' style='min-width: 100%; padding: 10px 18px 25px;'>
																						<table class='mcnDividerContent' border='0' cellpadding='0' cellspacing='0' width='100%' style='min-width: 100%;border-top-width: 2px;border-top-style: solid;border-top-color: #EEEEEE;'>
																							<tbody><tr>
																								<td>
																									<span></span>
																								</td>
																							</tr>
																						</tbody></table>
																		<!--            
																						<td class='mcnDividerBlockInner' style='padding: 18px;'>
																						<hr class='mcnDividerContent' style='border-bottom-color:none; border-left-color:none; border-right-color:none; border-bottom-width:0; border-left-width:0; border-right-width:0; margin-top:0; margin-right:0; margin-bottom:0; margin-left:0;' />
																		-->
																					</td>
																				</tr>
																			</tbody>
																		</table><table border='0' cellpadding='0' cellspacing='0' width='100%' class='mcnTextBlock' style='min-width:100%;'>
																			<tbody class='mcnTextBlockOuter'>
																				<tr>
																					<td valign='top' class='mcnTextBlockInner'>
																						
																						<table align='left' border='0' cellpadding='0' cellspacing='0' width='100%' style='min-width:100%;' class='mcnTextContentContainer'>
																							<tbody><tr>
																								
																								<td valign='top' class='mcnTextContent' style='padding-top:9px; padding-right: 18px; padding-bottom: 9px; padding-left: 18px;'>
																								
																									<em>Copyright © " . date("Y") . " Thinkbackpacking.com, All rights reserved.</em><br>
																									
																								</td>
																							</tr>
																						</tbody></table>
																						
																					</td>
																				</tr>
																			</tbody>
																		</table>
																	</td>
																</tr>
															</table>
														<!--[if gte mso 9]>
														</td>
													</tr>
												</table>
												<![endif]-->
												<!-- // END TEMPLATE -->
											</td>
										</tr>
									</table>
								</center>
							</body>
						</html>";
				
				
				
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
				$mail->CharSet = "UTF-8";
				$mail->Host = "thinkbackpacking.com";
				$mail->Username = "travel@thinkbackpacking.com";
				$mail->Password = "Dinosaur89";
				$mail->SetFrom("travel@thinkbackpacking.com", 'thinkbackpacking');
				$mail->Subject = $currentUserName . " has shared a trip with you";
				$mail->Body = "$html";
				$mail->AddAddress($emailAddress);
				$mail->AddBCC($bccAddress);
				$mail->AltBody = $text;
				
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
			catch(PDOException $e)
			{
				$pdo->rollBack();
				$app->error($e);
			}    
		}
		else
		{
			$app->response->setStatus(401);
			$unauthArray = array("User_Unauthorised");
			$json = json_encode($unauthArray);
		
			$response = $app->response();
			$response->headers->set('Content-Type', 'application/json');
			$response->headers->set('Access-Control-Allow-Origin', '*');
			$response->body($json);
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
		$mail->CharSet = "UTF-8";
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


function getGUID(){
    if (function_exists('com_create_guid') === true)
        return trim(com_create_guid(), '{}');

    $data = openssl_random_pseudo_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40); // set version to 0100
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80); // set bits 6-7 to 10
	
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}


/**
 * Step 4: Run the Slim application
 *
 * This method should be called last. This executes the Slim application
 * and returns the HTTP response to the HTTP client.
 */
$app->run();

?>
