window.onload = function() {
	addTitlebar("top-titlebar", "logo.png");
	updateContentStyle();
}

window.onresize = function() {
	updateContentStyle();
};

function addTitlebar(titlebar_name, titlebar_icon_url) {
  var titlebar = document.createElement("div");
  titlebar.style.backgroundColor = "#3a3d3d";
  titlebar.setAttribute("id", titlebar_name);
  titlebar.setAttribute("class", titlebar_name);

  var icon = document.createElement("div");
  icon.setAttribute("class", titlebar_name + "-icon");
  icon.appendChild(createImage(titlebar_name + "icon", titlebar_icon_url, 20 ,20));
  titlebar.appendChild(icon);
  
  var closeButton = createButton(titlebar_name + "-close-button",
                                 titlebar_name + "-close-button",
                                 "button_close.png",
                                 "button_close_hover.png",
                                 closeWindow);
  titlebar.appendChild(closeButton);
  document.body.appendChild(titlebar);
}

function closeWindow() {
  window.close();
}

function createImage(image_id, image_url, image_width, image_height) {
  var image = document.createElement("img");
  image.setAttribute("id", image_id);
  image.src = image_url;
  if(image_width) image.width = image_width;
  if(image_height) image.height = image_height;
  return image;
}

function updateImageUrl(image_id, new_image_url) {
  var image = document.getElementById(image_id);
  if (image)
    image.src = new_image_url;
}

function createButton(button_id, button_name, 
				normal_image_url, hover_image_url, click_func)
{
  var button = document.createElement("div");
  button.setAttribute("class", button_name);
  var button_img = createImage(button_id, normal_image_url);
  button.appendChild(button_img);
  button.onmouseover = function() {
    updateImageUrl(button_id, hover_image_url);
  }
  button.onmouseout = function() {
    updateImageUrl(button_id, normal_image_url);
  }
  button.onclick = click_func;
  return button;
}

function updateContentStyle()
{
  var content = document.getElementById("content");
  if (!content)
    return;

  var left = 0;
  var top = 0;
  var width = window.outerWidth;
  var height = window.outerHeight;

  var titlebar = document.getElementById("top-titlebar");
  if (titlebar)
  {
    height -= titlebar.offsetHeight;
    top += titlebar.offsetHeight;
  }

  var contentStyle = "position: absolute; ";
  contentStyle += "left: " + left + "px; ";
  contentStyle += "top: " + top + "px; ";
  contentStyle += "width: " + width + "px; ";
  contentStyle += "height: " + height + "px; ";
  content.setAttribute("style", contentStyle);
}