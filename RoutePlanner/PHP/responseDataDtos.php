<?php

class Trip {

	function __construct ($tripData) {
		$this->Id = $tripData['Id'];
		$this->Name = $tripData['Name'];
		$this->StartDate = $tripData['StartDate'];
		$this->EndDate = $tripData['EndDate'];
		$this->NumberOfStops = $tripData['NumberOfStops'];
		$this->NumberOfNights = $tripData['NumberOfNights'];
		$this->TotalCost = $tripData['TotalCost'];
		$this->CurrencyId = $tripData['CurrencyId'];
		$this->CurrencyName = $tripData['CurrencyName'];
		$this->Token = $tripData['Token'];
	}

	public $Id;
    public $Name;
    public $StartDate;
    public $EndDate;
    public $NumberOfStops;
    public $NumberOfNights;
    public $TotalCost;
	public $CurrencyId;
	public $CurrencyName;
	public $Token;
}

class TripResult {
	public $Trip;
	public $Route;
}

class Location {

	function __construct ($routeData) {
		$this->Id = $routeData['Id'];
		$this->Place = $routeData['Place'];
		$this->Country = $routeData['Country'];
		$this->Full_Name = $routeData['Full_Name'];	
		$this->DailyCost = $routeData['DailyCost'];	
		$this->Latitude = $routeData['Latitude'];	
		$this->Longitude = $routeData['Longitude'];	
		$this->IsAirport = $routeData['IsAirport'];
	}
	
	public $Id;
 	public $Place;
	public $Country;
	public $Full_Name;	
	public $DailyCost;	
	public $Latitude;	
	public $Longitude;	
	public $IsAirport;
}

class Route {

	function __construct ($routeData, $routeLength) {
		$this->id = $routeData['RouteId']; // set when creating the route
		$this->location = new Location($routeData);
		$this->coords = new Coords($routeData);
		$this->stop = $routeData['StopNumber'];
		$this->nights = $routeData['Nights'];
		$this->dailyCost = $routeData['DailyCost'];
		$this->totalCost = $routeData['TotalCost'];
		$this->transportId = $routeData['TransportId'];
		$this->transportName = $routeData['TransportName'];
		$this->options = new Options($routeData);
		$this->style = new Style();
	}
	
	public $id;
	public $stop;
	public $location;
	public $coords;
	public $nights;
	public $dailyCost;
	public $totalCost;
	public $transportId;
	public $transportName;
	public $options;
	public $style;
}

class Coords {

	function __construct ($routeData) {
		$this->latitude = $routeData['Latitude'];	
		$this->longitude = $routeData['Longitude'];	
	}
	
	public $latitude;	
	public $longitude;	
}

class Options {
	
	function __construct ($routeData) {
		$this->labelAnchor = '15 45';	
	}
	
	public $labelAnchor;
}

class Style {

}

?>