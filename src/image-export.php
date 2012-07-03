<?php

function getFormat($type) {
    if (eregi('png', $type)) {
        return 'png';
    } else if (eregi('jpg', $type)) {
        return 'jpg';
    }
    return 'gif';
}

function getName() {
    return 'images/' . time();
}

function saveToFile($filename, $content) {
    $fl = fopen($filename, 'w');
    fwrite($fl, $content);
    fclose($fl);
    return $filename;
}

function convertImage($inputFile, $outputFile) {
    exec('/usr/bin/convert ' . $inputFile . ' ' . $outputFile . '');
    if (file_exists($outputFile)) {
        return true;
    }
    return false;
}

function setDownloadHeaders($filename, $exportedImage) {
    header('Content-Type: application/x-download');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length:' . filesize($exportedImage));
}

function setErrorHeaders() {
    header('Status: 404 Not Found');
}

if (isset($_POST['image']) && isset($_POST['format'])) {
    $image = $_POST['image'];
    $format = getFormat($_POST['format']);
    if (isset($_POST['imageName'])) {
        $imageName = $_POST['imageName'] . '.' . $format;
    } else {
        $imageName = 'chart.' . $format;
    }
    $baseName = getName();
    $exportedImage = $baseName . '.' . $format;
    $svgFileName = $baseName . '.svg';
    saveToFile($svgFileName, $image);    
    $status = convertImage($svgFileName, $exportedImage);
    unlink($svgFileName);
    if ($status) {
        setDownloadHeaders($imageName, $exportedImage);
        readfile($exportedImage);
        unlink($exportedImage);
        exit;
    }
}

setErrorHeaders();

?>