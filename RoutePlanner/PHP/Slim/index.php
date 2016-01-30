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
		$app->log->INFO($trip_authenticated);
		$app->log->INFO(count($tripData));
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

		global $current_user;
		get_currentuserinfo();
		
		$tripId = $_POST['tripId'];
		$userId = get_current_user_id();
		
		$username = $current_user->display_name == null ? "Backpacker" : $current_user->display_name;
		
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

			$text = "Dear " . $recipientName . ",\r\n\r\nThank you for planning your world travel experience with Thinkbackpacking.com!\r\n\r\nHappy trails!\r\n\r\n";
		
			foreach ($tripData as $row)
			{		
				$tripName = $row['Name'];
				$startDate = date('jS M Y', strtotime($row['StartDate']));
				$endDate = date('jS M Y', strtotime($$row['EndDate']));
				$currencySymbol = $row['CurrencySymbol'];
				$totalCost = $row['TotalCost'];
			}
			
			$text .= $tripName . "\r\n\r\n";
		
			$text .= "Start Date: " . $startDate . "\r\nEnd Date: " . $endDate . "\r\nTotal Cost: " . $currencySymbol . $totalCost . "\r\n\r\n";
				
			//create HTML email
			
			$html = "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'><html xmlns='http://www.w3.org/1999/xhtml'><head> <title></title> <meta http-equiv='Content-Type' content='text/html; charset=utf-8' /> <style type='text/css'> .font-sans-serif { font-family: sans-serif; } .font-avenir { font-family: Avenir, sans-serif; } .mso .wrapper .font-avenir { font-family: sans-serif !important; } .font-lato { font-family: Lato, Tahoma, sans-serif; } .mso .wrapper .font-lato { font-family: Tahoma, sans-serif !important; } .font-cabin { font-family: Cabin, Avenir, sans-serif; } .mso .wrapper .font-cabin { font-family: sans-serif !important; } .font-open-Sans { font-family: 'Open Sans', sans-serif; } .mso .wrapper .font-open-Sans { font-family: sans-serif !important; } .font-roboto { font-family: Roboto, Tahoma, sans-serif; } .mso .wrapper .font-roboto { font-family: Tahoma, sans-serif !important; } .font-ubuntu { font-family: Ubuntu, sans-serif; } .mso .wrapper .font-ubuntu { font-family: sans-serif !important; } .font-pt-sans { font-family: 'PT Sans', 'Trebuchet MS', sans-serif; } .mso .wrapper .font-pt-sans { font-family: 'Trebuchet MS', sans-serif !important; } .font-georgia { font-family: Georgia, serif; } .font-merriweather { font-family: Merriweather, Georgia, serif; } .mso .wrapper .font-merriweather { font-family: Georgia, serif !important; } .font-bitter { font-family: Bitter, Georgia, serif; } .mso .wrapper .font-bitter { font-family: Georgia, serif !important; } .font-pt-serif { font-family: 'PT Serif', Georgia, serif; } .mso .wrapper .font-pt-serif { font-family: Georgia, serif !important; } .font-pompiere { font-family: Pompiere, 'Trebuchet MS', sans-serif; } .mso .wrapper .font-pompiere { font-family: 'Trebuchet MS', sans-serif !important; } .font-roboto-slab { font-family: 'Roboto Slab', Georgia, serif; } .mso .wrapper .font-roboto-slab { font-family: Georgia, serif !important; } @media only screen and (max-width: 620px) { .wrapper .column .size-8 { font-size: 8px !important; line-height: 14px !important; } .wrapper .column .size-9 { font-size: 9px !important; line-height: 16px !important; } .wrapper .column .size-10 { font-size: 10px !important; line-height: 18px !important; } .wrapper .column .size-11 { font-size: 11px !important; line-height: 19px !important; } .wrapper .column .size-12 { font-size: 12px !important; line-height: 19px !important; } .wrapper .column .size-13 { font-size: 13px !important; line-height: 21px !important; } .wrapper .column .size-14 { font-size: 14px !important; line-height: 21px !important; } .wrapper .column .size-15 { font-size: 15px !important; line-height: 23px !important; } .wrapper .column .size-16 { font-size: 16px !important; line-height: 24px !important; } .wrapper .column .size-17 { font-size: 17px !important; line-height: 26px !important; } .wrapper .column .size-18 { font-size: 17px !important; line-height: 26px !important; } .wrapper .column .size-20 { font-size: 17px !important; line-height: 26px !important; } .wrapper .column .size-22 { font-size: 18px !important; line-height: 26px !important; } .wrapper .column .size-24 { font-size: 20px !important; line-height: 28px !important; } .wrapper .column .size-26 { font-size: 22px !important; line-height: 31px !important; } .wrapper .column .size-28 { font-size: 24px !important; line-height: 32px !important; } .wrapper .column .size-30 { font-size: 26px !important; line-height: 34px !important; } .wrapper .column .size-32 { font-size: 28px !important; line-height: 36px !important; } .wrapper .column .size-34 { font-size: 30px !important; line-height: 38px !important; } .wrapper .column .size-36 { font-size: 30px !important; line-height: 38px !important; } .wrapper .column .size-40 { font-size: 32px !important; line-height: 40px !important; } .wrapper .column .size-44 { font-size: 34px !important; line-height: 43px !important; } .wrapper .column .size-48 { font-size: 36px !important; line-height: 43px !important; } .wrapper .column .size-56 { font-size: 40px !important; line-height: 47px !important; } .wrapper .column .size-64 { font-size: 44px !important; line-height: 50px !important; } } body { margin: 0; padding: 0; min-width: 100%; } .mso body { mso-line-height-rule: exactly; } .no-padding .wrapper .column .column-top, .no-padding .wrapper .column .column-bottom { font-size: 0px; line-height: 0px; } table { border-collapse: collapse; border-spacing: 0; } td { padding: 0; vertical-align: top; } .spacer, .border { font-size: 1px; line-height: 1px; } .spacer { width: 100%; } img { border: 0; -ms-interpolation-mode: bicubic; } .image { font-size: 12px; mso-line-height-rule: at-least; } .image img { display: block; } .logo { mso-line-height-rule: at-least; } .logo img { display: block; } strong { font-weight: bold; } h1, h2, h3, p, ol, ul, blockquote, .image { font-style: normal; font-weight: 400; } ol, ul, li { padding-left: 0; } blockquote { Margin-left: 0; Margin-right: 0; padding-right: 0; } .column-top, .column-bottom { font-size: 40px; line-height: 40px; transition-timing-function: cubic-bezier(0, 0, 0.2, 1); transition-duration: 150ms; transition-property: all; } .half-padding .column .column-top, .half-padding .column .column-bottom { font-size: 20px; line-height: 20px; } .column { text-align: left; } .contents { table-layout: fixed; width: 100%; } .padded { padding-left: 56px; padding-right: 56px; word-break: break-word; word-wrap: break-word; } .wrapper { display: table; table-layout: fixed; width: 100%; min-width: 620px; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; } .wrapper a { transition: opacity 0.2s ease-in; } table.wrapper { table-layout: fixed; } .one-col, .two-col, .three-col { Margin-left: auto; Margin-right: auto; width: 600px; } .centered { Margin-left: auto; Margin-right: auto; } .btn a { border-radius: 3px; display: inline-block; font-size: 14px; font-weight: 700; line-height: 24px; padding: 13px 35px 12px 35px; text-align: center; text-decoration: none !important; } .btn a:hover { opacity: 0.8; } .two-col .btn a { font-size: 12px; line-height: 22px; padding: 10px 28px; } .three-col .btn a, .two-col .column-narrower .btn a, .three-col .column .btn a { font-size: 11px; line-height: 19px; padding: 6px 18px 5px 18px; } @media only screen and (max-width: 620px) { .btn a { display: block !important; font-size: 14px !important; line-height: 24px !important; padding: 13px 10px 12px 10px !important; } } .two-col .column-top, .two-col .column-bottom { font-size: 24px; line-height: 24px; } .half-padding .two-col .column-top, .half-padding .two-col .column-bottom { font-size: 12px; line-height: 12px; } .two-col .column { width: 290px; } .two-col .gutter { width: 20px; font-size: 1px; line-height: 1px; } .two-col .padded { padding-left: 24px; padding-right: 24px; } .three-col .column-top, .three-col .column-bottom { font-size: 24px; line-height: 24px; } .half-padding .three-col .column-top, .half-padding .three-col .column-bottom { font-size: 12px; line-height: 12px; } .three-col .column { width: 188px; } .three-col .gutter { width: 18px; font-size: 1px; line-height: 1px; } .three-col .padded { padding-left: 24px; padding-right: 24px; } .wider { width: 392px; } .narrower { width: 188px; } @media only screen and (min-width: 0) { .wrapper { text-rendering: optimizeLegibility; } } @media only screen and (max-width: 620px) { [class=wrapper] { min-width: 320px !important; width: 100% !important; } [class=wrapper] .one-col, [class=wrapper] .two-col, [class=wrapper] .three-col { width: 320px !important; } [class=wrapper] .column, [class=wrapper] .gutter { display: block; float: left; width: 320px !important; } [class=wrapper] .padded { padding-left: 20px !important; padding-right: 20px !important; } [class=wrapper] .block { display: block !important; } [class=wrapper] .hide { display: none !important; } [class=wrapper] .image img { height: auto !important; width: 100% !important; } } .footer { width: 100%; } .footer .inner { padding: 58px 0 29px 0; width: 600px; } .footer .left td, .footer .right td { font-size: 12px; line-height: 22px; } .footer .left td { text-align: left; width: 400px; } .footer .right td { max-width: 200px; mso-line-height-rule: at-least; } .footer .links { line-height: 26px; Margin-bottom: 26px; mso-line-height-rule: at-least; } .footer .links a:hover { opacity: 0.8; } .footer .links img { vertical-align: middle; } .footer .address { Margin-bottom: 18px; } .footer .campaign { Margin-bottom: 18px; } .footer .campaign a { font-weight: bold; text-decoration: none; } .footer .sharing div { Margin-bottom: 5px; } .wrapper .footer .fblike, .wrapper .footer .tweet, .wrapper .footer .linkedinshare, .wrapper .footer .forwardtoafriend { background-repeat: no-repeat; background-size: 200px 56px; border-radius: 2px; color: #ffffff; display: block; font-size: 11px; font-weight: bold; line-height: 11px; padding: 8px 11px 7px 28px; text-align: left; text-decoration: none; } .wrapper .footer .fblike:hover, .wrapper .footer .tweet:hover, .wrapper .footer .linkedinshare:hover, .wrapper .footer .forwardtoafriend:hover { color: #ffffff !important; opacity: 0.8; } .footer .fblike { background-image: url(https://i7.createsend1.com/static/eb/master/06-journal/imgf/fblike.png); } .footer .tweet { background-image: url(https://i8.createsend1.com/static/eb/master/06-journal/imgf/tweet.png); } .footer .linkedinshare { background-image: url(https://i9.createsend1.com/static/eb/master/06-journal/imgf/lishare.png); } .footer .forwardtoafriend { background-image: url(https://i1.createsend1.com/static/eb/master/06-journal/imgf/forward.png); } @media only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx) { .footer .fblike { background-image: url(https://i10.createsend1.com/static/eb/master/06-journal/imgf/fblike@2x.png) !important; } .footer .tweet { background-image: url(https://i2.createsend1.com/static/eb/master/06-journal/imgf/tweet@2x.png) !important; } .footer .linkedinshare { background-image: url(https://i3.createsend1.com/static/eb/master/06-journal/imgf/lishare@2x.png) !important; } .footer .forwardtoafriend { background-image: url(https://i4.createsend1.com/static/eb/master/06-journal/imgf/forward@2x.png) !important; } } @media only screen and (max-width: 620px) { .footer { width: 320px !important; } .footer td { display: none; } .footer .inner, .footer .inner td { display: block; text-align: center !important; max-width: 320px !important; width: 320px !important; } .footer .sharing { Margin-bottom: 40px; } .footer .sharing div { display: inline-block; } .footer .fblike, .footer .tweet, .footer .linkedinshare, .footer .forwardtoafriend { display: inline-block !important; } } .wrapper h1, .wrapper h2, .wrapper h3, .wrapper p, .wrapper ol, .wrapper ul, .wrapper li, .wrapper blockquote, .image, .btn, .divider { Margin-bottom: 0; Margin-top: 0; } .wrapper .column h1 + * { Margin-top: 18px; } .wrapper .column h2 + * { Margin-top: 16px; } .wrapper .column h3 + * { Margin-top: 14px; } .wrapper .column p + *, .wrapper .column ol + *, .wrapper .column ul + *, .wrapper .column blockquote + *, .image + .contents td > :first-child { Margin-top: 22px; } .wrapper .column li + * { Margin-top: 11px; } .contents:nth-last-child(n+3) h1:last-child, .no-padding .contents:nth-last-child(n+2) h1:last-child { Margin-bottom: 18px; } .contents:nth-last-child(n+3) h2:last-child, .no-padding .contents:nth-last-child(n+2) h2:last-child { Margin-bottom: 16px; } .contents:nth-last-child(n+3) h3:last-child, .no-padding .contents:nth-last-child(n+2) h3:last-child { Margin-bottom: 14px; } .contents:nth-last-child(n+3) p:last-child, .no-padding .contents:nth-last-child(n+2) p:last-child, .contents:nth-last-child(n+3) ol:last-child, .no-padding .contents:nth-last-child(n+2) ol:last-child, .contents:nth-last-child(n+3) ul:last-child, .no-padding .contents:nth-last-child(n+2) ul:last-child, .contents:nth-last-child(n+3) blockquote:last-child, .no-padding .contents:nth-last-child(n+2) blockquote:last-child, .contents:nth-last-child(n+3) .image, .no-padding .contents:nth-last-child(n+2) .image, .contents:nth-last-child(n+3) .divider, .no-padding .contents:nth-last-child(n+2) .divider, .contents:nth-last-child(n+3) .btn, .no-padding .contents:nth-last-child(n+2) .btn { Margin-bottom: 22px; } .two-col .column p + *, .two-col .column ol + *, .two-col .column ul + *, .two-col .column blockquote + *, .two-col .image + .contents td > :first-child { Margin-top: 21px; } .two-col .column li + * { Margin-top: 10px; } .two-col .contents:nth-last-child(n+3) p:last-child, .no-padding .two-col .contents:nth-last-child(n+2) p:last-child, .two-col .contents:nth-last-child(n+3) ol:last-child, .no-padding .two-col .contents:nth-last-child(n+2) ol:last-child, .two-col .contents:nth-last-child(n+3) ul:last-child, .no-padding .two-col .contents:nth-last-child(n+2) ul:last-child, .two-col .contents:nth-last-child(n+3) blockquote:last-child, .no-padding .two-col .contents:nth-last-child(n+2) blockquote:last-child, .two-col .contents:nth-last-child(n+3) .image, .no-padding .two-col .contents:nth-last-child(n+2) .image, .two-col .contents:nth-last-child(n+3) .divider, .no-padding .two-col .contents:nth-last-child(n+2) .divider, .two-col .contents:nth-last-child(n+3) .btn, .no-padding .two-col .contents:nth-last-child(n+2) .btn { Margin-bottom: 21px; } .three-col .column p + *, .two-col .column-narrower p + *, .three-col .column ol + *, .two-col .column-narrower ol + *, .three-col .column ul + *, .two-col .column-narrower ul + *, .three-col .column blockquote + *, .two-col .column-narrower blockquote + *, .three-col .column .image + .contents td > :first-child, .two-col .column-narrower .image + .contents td > :first-child, .three-col .column p + *, .three-col .column ol + *, .three-col .column ul + *, .three-col .column blockquote + *, .three-col .column .image + .contents td > :first-child { Margin-top: 20px; } .three-col .column li + *, .two-col .column-narrower li + *, .three-col .column li + * { Margin-top: 10px; } .three-col .contents:nth-last-child(n+3) p:last-child, .no-padding .three-col .contents:nth-last-child(n+2) p:last-child, .three-col .contents:nth-last-child(n+3) ol:last-child, .no-padding .three-col .contents:nth-last-child(n+2) ol:last-child, .three-col .contents:nth-last-child(n+3) ul:last-child, .no-padding .three-col .contents:nth-last-child(n+2) ul:last-child, .three-col .contents:nth-last-child(n+3) blockquote:last-child, .no-padding .three-col .contents:nth-last-child(n+2) blockquote:last-child, .three-col .contents:nth-last-child(n+3) .image, .no-padding .three-col .contents:nth-last-child(n+2) .image, .three-col .contents:nth-last-child(n+3) .divider, .no-padding .three-col .contents:nth-last-child(n+2) .divider, .three-col .contents:nth-last-child(n+3) .btn, .no-padding .three-col .contents:nth-last-child(n+2) .btn { Margin-bottom: 20px; } @media only screen and (max-width: 620px) { .wrapper p + *, .wrapper ol + *, .wrapper ul + *, .wrapper blockquote + *, .image + .contents td > :first-child { Margin-top: 22px !important; } .contents:nth-last-child(n+3) p:last-child, .no-padding .contents:nth-last-child(n+2) p:last-child, .contents:nth-last-child(n+3) ol:last-child, .no-padding .contents:nth-last-child(n+2) ol:last-child, .contents:nth-last-child(n+3) ul:last-child, .no-padding .contents:nth-last-child(n+2) ul:last-child, .contents:nth-last-child(n+3) blockquote:last-child, .no-padding .contents:nth-last-child(n+2) blockquote:last-child, .contents:nth-last-child(n+3) .image:last-child, .no-padding .contents:nth-last-child(n+2) .image:last-child, .contents:nth-last-child(n+3) .divider:last-child, .no-padding .contents:nth-last-child(n+2) .divider:last-child, .contents:nth-last-child(n+3) .btn:last-child, .no-padding .contents:nth-last-child(n+2) .btn:last-child { Margin-bottom: 22px !important; } .column li + * { Margin-top: 11px !important; } } td { vertical-align: middle; } td.border { width: 1px; } tr.border { height: 1px; } tr.border td { line-height: 1px; } .divider { font-size: 1px; line-height: 1px; width: 13px; } .full-width { width: 600px; margin: 0 auto; } .contents { width: 100%; } .image div { display: block; } .padded .image { font-size: 0; } .image-frame { border-style: solid; border-width: 6px; display: inline-block; font-size: 12px; } .image-frame a, .image-frame a:hover { text-decoration: none; } .preheader { width: 100%; } .preheader .title, .preheader .webversion, .preheader .webversion a { font-size: 10px; line-height: 16px; letter-spacing: 0.01em; text-decoration: none; } .preheader .title { text-align: left; width: 385px; } .preheader .webversion { text-align: right; width: 215px; } .preheader .webversion a { font-weight: bold; } .header { width: 100%; Margin-left: auto; Margin-right: auto; } .header .logo { width: 600px; } .header .logo div { font-weight: bold; Margin-bottom: 0; } .header .logo div a { text-decoration: none; } .header .logo div.logo-center { text-align: center; } .header .logo div.logo-center img { Margin-left: auto; Margin-right: auto; } .one-col-bg, .two-col-bg, .three-col-bg, .one-col-feature-bg { width: 100%; } .one-col, .two-col, .three-col, .one-col-feature { Margin-left: auto; Margin-right: auto; table-layout: fixed; } .column { text-align: left; } .wrapper h1 { font-size: 22px; line-height: 30px; } .wrapper h2 { font-size: 16px; line-height: 24px; } .wrapper h3 { font-size: 16px; line-height: 24px; } .wrapper p, .wrapper ol, .wrapper ul { font-size: 13px; line-height: 22px; } .wrapper h1 a, .wrapper h2 a, .wrapper h3 a { text-decoration: none; } .wrapper blockquote { padding-left: 16px; Margin-left: 0; } .one-col ol, .one-col ul { Margin-left: 18px; } .one-col .image-frame { border-width: 8px; } .mso .one-col .divider { Margin-right: 475px; } .one-col-feature { width: 504px; } .one-col-feature .divider { Margin-left: auto; Margin-right: auto; } .one-col-feature .divider .mso { Margin-left: 213px !important; Margin-right: 214px !important; } .one-col-feature .padded { padding-left: 32px; padding-right: 32px; } .one-col-feature p, .one-col-feature h1, .one-col-feature h2, .one-col-feature h3, .one-col-feature .btn { text-align: center; } .one-col-feature ol, .one-col-feature ul { Margin-left: 20px; text-align: left; } .mso .one-col-feature li { padding-left: 5px !important; margin-left: 10px !important; } .one-col-feature blockquote { border-left: none; padding: 0; } @media only screen and (min-width: 0) { .one-col-feature blockquote { background-image: url(https://i5.createsend1.com/static/eb/master/06-journal/images/blockquote-bottomright.png); background-repeat: no-repeat; background-position: 100% 100%; } } .one-col-feature blockquote p { font-size: 16px; text-align: center; padding-left: 25px; padding-right: 25px; background-repeat: no-repeat; background-position: 0px 0px; } .one-col-feature blockquote p:first-child { background-image: url(https://i6.createsend1.com/static/eb/master/06-journal/images/blockquote-topleft.png); padding-top: 32px; } .one-col-feature blockquote p:last-child { padding-bottom: 32px; } .two-col td { vertical-align: middle; } .two-col ol, .two-col ul { Margin-left: 15px; } .mso .two-col .divider { Margin-right: 229px; } .two-col .column-wider { width: 392px; } .mso .two-col .column-wider .divider { Margin-right: 331px; } .two-col .column-narrower, .three-col .column { width: 188px; } .two-col .column-narrower ol, .two-col .column-narrower ul, .three-col .column ol, .three-col .column ul { Margin-left: 15px; } .two-col .column-narrower blockquote, .three-col .column blockquote { padding-left: 10px; } .two-col .column-narrower .image-frame, .three-col .column .image-frame { border-width: 4px; } .mso .two-col .column-narrower .divider, .mso .three-col .column .divider { Margin-right: 127px; } .contents h1 a, .contents h2 a, .contents h3 a { text-decoration: none; } .wrapper h2 { font-weight: bold; } @media only screen and (max-width: 620px) { [class=wrapper] .divider { margin: 0 0 22px 0 !important; width: 13px; } [class=wrapper] .one-col .column-top, [class=wrapper] .one-col .column-bottom { font-size: 32px !important; line-height: 32px !important; } [class=wrapper] .one-col-feature { width: 320px !important; } [class=wrapper] .one-col-feature .divider { margin: 0 auto 22px auto !important; } [class=wrapper] .one-col-feature blockquote { background-image: url(https://i8.createsend1.com/static/eb/master/06-journal/images/blockquote-bottomright@2x.png); background-size: 16px !important; padding: 0 !important; } [class=wrapper] .one-col-feature blockquote p:first-child { background-image: url(https://i7.createsend1.com/static/eb/master/06-journal/images/blockquote-topleft@2x.png); background-size: 16px !important; } [class=wrapper] .column-wider, [class=wrapper] .column-narrower { display: block; float: left; width: 320px !important; } [class=wrapper] .spacer { display: block !important; height: 22px !important; width: 320px !important; } [class=wrapper] .padded { padding-left: 20px !important; padding-right: 20px !important; } [class=wrapper] .image-frame { border-width: 8px !important; } [class=wrapper] h1 { font-size: 22px !important; line-height: 28px !important; } [class=wrapper] h2 { font-size: 16px !important; line-height: 22px !important; } [class=wrapper] h3 { font-size: 16px !important; line-height: 24px !important; } [class=wrapper] p, [class=wrapper] ol, [class=wrapper] ul { font-size: 14px !important; line-height: 22px !important; } [class=wrapper] ol, [class=wrapper] ul { margin-left: 19px !important; } [class=wrapper] li { padding: 0 !important; } [class=wrapper] blockquote { padding-left: 14px !important; } [class=wrapper] .gutter { font-size: 20px !important; line-height: 20px !important; height: 20px !important; } [class=wrapper] .header .logo { padding-left: 10px !important; padding-right: 10px !important; width: 320px !important; } [class=wrapper] .header .logo div { margin-bottom: 0 !important; } [class=wrapper] .header .logo div img { display: inline-block !important; max-width: 280px !important; height: auto !important; } [class=wrapper] .header .logo div a { text-decoration: none; } [class=wrapper] .webversion, [class=wrapper] .preheader table { width: 320px !important; } [class=wrapper] .preheader .webversion, [class=wrapper] .header .logo a { text-align: center !important; } [class=wrapper] .full-width { width: 320px !important; } [class=wrapper] .preheader *[class*='column'] { display: block !important; text-align: center; } [class=wrapper] .preheader *[class*='column'] table, [class=wrapper] .preheader *[class*='column'] hr { margin-left: auto; margin-right: auto; } [class=wrapper] .preheader .title { display: none !important; } } @media (-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi) { .one-col ul { border-left: 30px solid transparent; } } </style> <style type='text/css'> </style> <!--[if !mso]><!--><style type='text/css'> @import url(https://fonts.googleapis.com/css?family=PT+Serif:400,700,400italic,700italic|Ubuntu:400,700,400italic,700italic); </style><link href='https://fonts.googleapis.com/css?family=PT+Serif:400,700,400italic,700italic|Ubuntu:400,700,400italic,700italic' rel='stylesheet' type='text/css' /><!--<![endif]--><style type='text/css'> .wrapper h1{}.wrapper h1{font-family:Ubuntu,sans-serif}.mso .wrapper h1{font-family:sans-serif !important}.wrapper h2{}.wrapper h2{font-family:Ubuntu,sans-serif}.mso .wrapper h2{font-family:sans-serif !important}.wrapper h3{}.wrapper h3{font-family:'PT Serif',Georgia,serif}.mso .wrapper h3{font-family:Georgia,serif !important}.wrapper p,.wrapper ol,.wrapper ul,.wrapper .image{}.wrapper p,.wrapper ol,.wrapper ul,.wrapper .image{font-family:'PT Serif',Georgia,serif}.mso .wrapper p,.mso .wrapper ol,.mso .wrapper ul,.mso .wrapper .image{font-family:Georgia,serif !important}.wrapper .btn a{}.wrapper .btn a{font-family:'PT Serif',Georgia,serif}.mso .wrapper .btn a{font-family:Georgia,serif !important}.logo div{}.logo div{font-family:Roboto,Tahoma,sans-serif}.mso .logo div{font-family:Tahoma,sans-serif !important}.title,.webversion,.fblike,.tweet,.linkedinshare,.forwardtoafriend,.link,.address,.permission,.campaign{}.title,.webversion,.fblike,.tweet,.linkedinshare,.forwardtoafriend,.link,.address,.permission,.campaign{font-family:Ubuntu,sans-serif}.mso .title,.mso .webversion,.mso .fblike,.mso .tweet,.mso .linkedinshare,.mso .forwardtoafriend,.mso .link,.mso .address,.mso .permission,.mso .campaign{font-family:sans-serif !important}body,.wrapper,.emb-editor-canvas{background-color:#ededf1}.mso body{background-color:#fff !important}.mso .spacer,.mso .header,.mso .footer,.mso .one-col-bg,.mso .two-col-bg,.mso .three-col-bg,.mso .one-col-feature-bg{background-color:#ededf1}.wrapper h1{color:#3e4751}.wrapper h2{color:#3e4751}.wrapper h3{color:#788991}.wrapper p,.wrapper ol,.wrapper ul{color:#7c7e7f}.wrapper .image{color:#7c7e7f}.wrapper h1 a,.wrapper h2 a,.wrapper h3 a,.wrapper p a,.wrapper li a{color:#4eaacc}.wrapper h1 a:hover,.wrapper h2 a:hover,.wrapper h3 a:hover,.wrapper p a:hover,.wrapper li a:hover{text-decoration:none}.wrapper .btn a{background-color:#4eaacc;color:#fff}.wrapper .btn a:hover{color:#fff !important}.logo div{color:#c3ced9}.logo div a{color:#c3ced9}.logo div a:hover{color:#c3ced9 !important}.header,.footer .inner td{color:#7c7e7f}.wrapper .header a,.wrapper .footer a{color:#7c7e7f}.wrapper .header a:hover,.wrapper .footer a:hover{color:#565858 !important}.column-bg{background-color:#fff}.image-frame{background-color:#fff;border-color:#f2efe9}.preheader{background-color:#e4e4ea}.preheader .title,.preheader .webversion{color:#7c7e7f}.preheader .title a,.preheader .webversion a{color:#7c7e7f}.preheader .title a:hover,.preheader .webversion a:hover{color:#565858 !important}.divider{background-color:#c2c2d0}.one-col blockquote{border-left:4px solid #c2c2d0}.two-col blockquote,.narrower blockquote,.three-col blockquote{border-left:2px solid #c2c2d0}.one-col-feature blockquote p:first-child{border-top:1px solid #c2c2d0}.one-col-feature blockquote p:last-child{border-bottom:1px solid #c2c2d0}td.border{background-color:#ededf1}.emb-editor-canvas{background-color:#e4e4ea}@media (min-width:0){body{background-color:#e4e4ea}}.wrapper .footer .fblike,.wrapper .footer .tweet,.wrapper .footer .linkedinshare,.wrapper .footer .forwardtoafriend{background-color:#777779} </style><meta name='robots' content='noindex,nofollow' /> <meta property='og:title' content='My First Campaign' /> </head> 

			<!--[if mso]>
			  <body class='mso'>
			<![endif]-->
			<!--[if !mso]><!-->
			  <body class='full-padding' style='margin: 0;padding: 0;min-width: 100%;background-color: #ededf1;'>
			<!--<![endif]-->
				<center class='wrapper' style='display: table;table-layout: fixed;width: 100%;min-width: 620px;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%;background-color: #ededf1;'>
				  <table class='preheader' style='border-collapse: collapse;border-spacing: 0;width: 100%;background-color: #e4e4ea;'>
					<tbody><tr>
					  <td style='padding: 10px 0 12px 0;vertical-align: middle;'>
						<center>
						  <table class='full-width centered' style='border-collapse: collapse;border-spacing: 0;Margin-left: auto;Margin-right: auto;width: 600px;margin: 0 auto;'>
							<tbody><tr>
							  <td class='title column' style='padding: 0;vertical-align: middle;text-align: left;font-family: Ubuntu,sans-serif;font-size: 10px;line-height: 16px;letter-spacing: 0.01em;text-decoration: none;width: 385px;color: #7c7e7f;'>
								
							  </td>
							  
							</tr>
						  </tbody></table>
						</center>
					  </td>
					</tr>
				  </tbody></table>
				  <div class='spacer' style='font-size: 1px;line-height: 20px;width: 100%;'>&nbsp;</div>
				  <table class='header centered' style='border-collapse: collapse;border-spacing: 0;Margin-left: auto;Margin-right: auto;width: 100%;color: #7c7e7f;'>
					<tbody><tr>
					  <td style='padding: 0;vertical-align: middle;'>&nbsp;</td>
					  <td class='logo emb-logo-padding-box' style='padding: 0;vertical-align: middle;mso-line-height-rule: at-least;width: 600px;padding-top: 12px;padding-bottom: 26px;'>
						<div class='logo-center' style='font-family: Roboto,Tahoma,sans-serif;color: #c3ced9;font-weight: bold;Margin-bottom: 0;text-align: center;font-size: 0px !important;line-height: 0 !important;' align='center' id='emb-email-header'><img style='border: 0;-ms-interpolation-mode: bicubic;display: block;Margin-left: auto;Margin-right: auto;max-width: 330px;' src='" . $env['SiteURL']. "/wp-content/themes/devdmbootstrap3-child/images/title-inverse.png' alt='' width='330' height='61' /></div>
					  </td>
					  <td style='padding: 0;vertical-align: middle;'>&nbsp;</td>
					</tr>
				  </tbody></table>
				  
					  <table class='one-col-bg' style='border-collapse: collapse;border-spacing: 0;width: 100%;'>
						<tbody><tr>
						  <td style='padding: 0;vertical-align: middle;' align='center'>
							<table class='one-col centered column-bg' style='border-collapse: collapse;border-spacing: 0;Margin-left: auto;Margin-right: auto;background-color: #fff;width: 600px;table-layout: fixed;' emb-background-style>
							  <tbody><tr>
								<td class='column' style='padding: 0;vertical-align: middle;text-align: left;'>
								  <div><div class='column-top' style='font-size: 40px;line-height: 40px;transition-timing-function: cubic-bezier(0, 0, 0.2, 1);transition-duration: 150ms;transition-property: all;'>&nbsp;</div></div>
									<table class='contents' style='border-collapse: collapse;border-spacing: 0;table-layout: fixed;width: 100%;'>
									  <tbody><tr>
										<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
										  
											<div style='line-height:10px;font-size:1px'>&nbsp;</div>
					  
										</td>
									  </tr>
									</tbody></table>
								  
									<table class='contents' style='border-collapse: collapse;border-spacing: 0;table-layout: fixed;width: 100%;'>
									  <tbody><tr>
										<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
										  
											<h1 style='font-style: normal;font-weight: 400;Margin-bottom: 0;Margin-top: 14px;font-size: 22px;line-height: 30px;font-family: Ubuntu,sans-serif;color: #3e4751;text-align: left;'>
												<strong style='font-weight: bold;'>"
												. $tripName . 
												"</strong>
											</h1>
											
										</td>
									  </tr>
									</tbody></table>
								  
									<table class='contents' style='border-collapse: collapse;border-spacing: 0;table-layout: fixed;width: 100%;'>
									  <tbody><tr>
										<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
										  
											<div style='line-height:5px;font-size:1px'>&nbsp;</div>
					  
										</td>
									  </tr>
									</tbody></table>
								  
									<table class='contents' style='border-collapse: collapse;border-spacing: 0;table-layout: fixed;width: 100%;'>
									  <tbody><tr>
										<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
										  
											<h2 class='size-16' style='font-style: normal;font-weight: bold;Margin-bottom: 0;Margin-top: 0;font-size: 16px;line-height: 24px;font-family: Ubuntu,sans-serif;color: #3e4751;'><strong style='font-weight: bold;'>Someone has sent you a trip!!</strong></h2>
											
											<p style='font-style: normal;font-weight: 400;Margin-bottom: 0;Margin-top: 16px;font-size: 13px;line-height: 22px;font-family: Ubuntu,sans-serif;color: #7c7e7f;'>Dear " . $recipientName . ",</p>
											
											<p style='font-style: normal;font-weight: 400;Margin-bottom: 22px;Margin-top: 22px;font-size: 13px;line-height: 22px;font-family: Ubuntu,sans-serif;color: #7c7e7f;'>"
												. $username . " has chosen to share their trip with you. To view this trip please click on this button below. Your access will expire in 48 hours from receipt of this email.
											</p>
											
											<p style='font-style: normal;font-weight: 400;Margin-bottom: 22px;Margin-top: 22px;font-size: 13px;line-height: 22px;font-family: Ubuntu,sans-serif;color: #7c7e7f;'>
												Thank you for planning your world travel experience with Thinkbackpacking.com.
											</p>
											
											<p style='font-style: normal;font-weight: 400;Margin-bottom: 22px;Margin-top: 22px;font-size: 13px;line-height: 22px;font-family: Ubuntu,sans-serif;color: #7c7e7f;'>
												Happy trails!
											</p>
					  
										</td>
									  </tr>
									</tbody></table>
								  
									<table class='contents' style='border-collapse: collapse;border-spacing: 0;table-layout: fixed;width: 100%;'>
									  <tbody>
										<tr>
											<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
					
												<div class='btn' style='Margin-bottom: 22px;Margin-top: 0;text-align: center;'>
												  <![if !mso]><a style='border-radius: 3px;display: inline-block;font-size: 14px;font-weight: 700;line-height: 24px;padding: 13px 35px 12px 35px;text-align: center;text-decoration: none !important;transition: opacity 0.2s ease-in;font-family: Ubuntu,sans-serif;background-color: #4eaacc;color: #fff;' href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map?tripId=" . $tripId . "&token=" . $accessGUID . "' data-width='190'>View Trip</a><![endif]>
												  
												<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map?tripId=" . $tripId . "&token=" . $accessGUID . "' style='width:260px' arcsize='7%' fillcolor='#4EAACC' stroke='f'><v:textbox style='mso-fit-shape-to-text:t' inset='0px,12px,0px,11px'><center style='font-size:14px;line-height:24px;color:#FFFFFF;font-family: Ubuntu,sans-serif;font-weight:700;mso-line-height-rule:exactly;mso-text-raise:4px'>View Trip</center></v:textbox></v:roundrect><![endif]--></div>
					  
										</td>
									  </tr>
									  <tr>
											<td class='padded' style='padding: 0;vertical-align: middle;padding-left: 56px;padding-right: 56px;word-break: break-word;word-wrap: break-word;'>
					
												<div class='btn' style='Margin-bottom: 22px;Margin-top: 0;text-align: center;'>
												  <![if !mso]><a style='border-radius: 3px;display: inline-block;font-size: 14px;font-weight: 700;line-height: 24px;padding: 13px 35px 12px 35px;text-align: center;text-decoration: none !important;transition: opacity 0.2s ease-in;font-family: Ubuntu,sans-serif;background-color: #4eaacc;color: #fff;' href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map' data-width='190'>Create Trip</a><![endif]>
												  
												<!--[if mso]><v:roundrect xmlns:v='urn:schemas-microsoft-com:vml' href='" . $env['SiteURL'] . "/planning/round-the-world-trip-planning-map' style='width:260px' arcsize='7%' fillcolor='#4EAACC' stroke='f'><v:textbox style='mso-fit-shape-to-text:t' inset='0px,12px,0px,11px'><center style='font-size:14px;line-height:24px;color:#FFFFFF;font-family: Ubuntu,sans-serif;font-weight:700;mso-line-height-rule:exactly;mso-text-raise:4px'>Create Trip</center></v:textbox></v:roundrect><![endif]--></div>
					  
										</td>
									  </tr>
									</tbody></table>
								  
								  <div class='column-bottom' style='font-size: 40px;line-height: 40px;transition-timing-function: cubic-bezier(0, 0, 0.2, 1);transition-duration: 150ms;transition-property: all;'>&nbsp;</div>
								</td>
							  </tr>
							</tbody></table>
						  </td>
						</tr>
					  </tbody></table>
					
					  <div class='spacer' style='font-size: 1px;line-height: 60px;width: 100%;'>&nbsp;</div>
					
				</center>
			  

			</body></html>";


			
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
