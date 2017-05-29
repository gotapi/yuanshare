<?php
$file = $_FILES["tosave"];
$spl = new SplFileInfo($file["name"]);
$ext = strtolower($spl->getExtension());
if($ext == "php") {
	$ext = "phpsource";
};
if($ext==""){
	$ext = "unkown";
}
$y= date("Ym");
mkdir("./files/".$y);
$dest = $y."/".array_sum(explode(".",microtime())).".".array_shift(explode(".",$file["name"])).".".$ext;
if(move_uploaded_file($file["tmp_name"],"./files/".$dest)){
	echo json_encode(array("code"=>200,"url"=>"http://cdn.162cm.net/share/files/".$dest));
}else{
	echo json_encode(array("code"=>500,"msg"=>$_FILES,"file"=>$file,"dst"=>$dest));
}