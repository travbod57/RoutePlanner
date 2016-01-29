<?php

	$pdo = new PDO('mysql:dbname=traveltool;host=localhost','root','', array(PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES \'UTF8\''));

	$delete_access_tokens_sql = "DELETE FROM accesstoken WHERE ExpiryDate <= NOW()";
	
	$stmt[0] = $pdo->prepare($delete_access_tokens_sql);
	
	try
	{
		$pdo->beginTransaction();
		$stmt[0]->execute();  

		$pdo->commit();     
	}
	catch(PDOException $e)
	{
		$pdo->rollBack();
		$app->error($e);
	}    
			
?>