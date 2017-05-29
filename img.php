<?php
ob_start();
function resError($code,$msg){
  header("Content-Type:application/json");
  echo json_encode(array("code"=>$code,"msg"=>$msg));
  exit();
}
function resSucc($msg){
  header("Content-Type:application/json");
  $code= 200;
  echo json_encode(array("code"=>$code,"msg"=>$msg));
}
$d =$_POST["d"];
$seg = explode(";",$d);
if(sizeof($seg)!=2){
  resError(400,"wrong paramater" );
}
$segments = explode(",",$seg[1]);
if(sizeof($segments)!=2){
  resError(400,"wrong paramter");
}
$data = $segments[1];
$encoding = $segments[0];

$header = explode(":",$seg[0]);
if(sizeof($header)!=2){
  resError(400,"wrong paramter");
}

$mime = explode("/",$header[1]);
if(sizeof($header)!=2){
  resError(400,"wrong paramter");
}
$extName =  strtolower($mime[1]);
if(!in_array($extName,array("jpg","bmp","gif","png"))) {
  resError(403,"bad extension name of the file");
}
try{
  $real_data = base64_decode($data);
}catch(Exception $e){
  resError(402,"parse data failed");
}

$y= date("Ym");
if(!file_exists("./files/".$y)){
  mkdir("./files/".$y);
}
$dest = $y."/".array_sum(explode(".",microtime())).".".rand(1000,9999).".".$extName;

file_put_contents("./files/".$dest,$real_data);
resSucc("http://cdn.162cm.net/share/files/".$dest);
