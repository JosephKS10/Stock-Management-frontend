import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/CleanerAuthContext";
import { useNavigate } from "react-router-dom";
import "./CleanerOrder.css";
import { MdOutlineCalendarToday } from "react-icons/md";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { fetchSiteData, fetchProductData } from "../../utils/api"; // Import the utility functions


function CleanerOrder() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [currentTime, setCurrentTime] = useState(getFormattedTime());
  const [selectedDate, setSelectedDate] = useState(getFormattedDate());
  const [cleanerEmail, setCleanerEmail] = useState("");
  const [productData, setProductData] = useState([]);

  const { authToken, siteId, sessionExpired, setSessionExpired, logout } = useAuth();
  const [siteData, setSiteData] = useState(null);
  const navigate = useNavigate();


  // camera live feed variables
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [capturedProductImages, setCapturedProductImages] = useState([]); // For product images
  const [roomImages, setRoomImages] = useState([]); // For room images
  const [isRoomImageCapture, setIsRoomImageCapture] = useState(false); // Track if capturing room 
  const [videoStream, setVideoStream] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentProductIndex, setCurrentProductIndex] = useState(null);



  // validation and Error handling
  const [errors, setErrors] = useState({});

  const handleCleanerEmailChange = (event) => {
    setCleanerEmail(event.target.value);
};

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getFormattedTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authToken) {
      navigate("/");
      return;
    }

    const getSiteData = async () => {
      try {
        const data = await fetchSiteData(siteId, authToken); // Use the utility function
        setSiteData(data);

        if (data.product_list.length > 0) {
          fetchProducts(data.product_list);
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
      }
    };

    getSiteData();
  }, [authToken, siteId]);

  useEffect(() => {
    if (showCameraPopup) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Camera access error:", err));
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop()); // Stop camera
      }
    }
  }, [showCameraPopup]);

  const handleCaptureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
  
    const context = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
  
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const imageData = canvasRef.current.toDataURL("image/png"); // Convert to image URL
  
    if (isRoomImageCapture) {
      setRoomImages((prev) => [...prev, imageData].slice(0, 5)); // Limit to 5 images for room
    } else {
      setCapturedProductImages((prev) => [...prev, imageData]); // For product images
    }
  };
  
  // Save Captured Images to Product Data
  useEffect(() => {
    if (capturedProductImages.length > 0 && currentProductIndex !== null) {
      setProductData((prevProducts) =>
        prevProducts.map((product, i) =>
          i === currentProductIndex ? { ...product, images: capturedProductImages } : product
        )
      );
    }
  }, [capturedProductImages]);

  const removeImage = (index, imageIndex) => {
    setProductData((prevProducts) =>
      prevProducts.map((product, i) =>
        i === index
          ? { ...product, images: product.images.filter((_, imgIdx) => imgIdx !== imageIndex) }
          : product
      )
    );
  };

  const removeRoomImage = (imageIndex) => {
    setRoomImages((prev) => prev.filter((_, idx) => idx !== imageIndex));
  };

  

  const fetchProducts = async (productIds) => {
    try {
      const data = await fetchProductData(productIds, authToken); // Use the utility function
      setProductData(
        data.map((product) => ({
          ...product,
          quantity: 0,
          availableQuantity: 0,
          expanded: false,
          siteItems: null, // "yes" or "no"
          images: [],
        }))
      );
    } catch (error) {
      console.error("Error fetching product data:", error.message);
    }
  };

  const handleQuantityChange = (index, type, field) => {
    setProductData((prevProducts) =>
      prevProducts.map((product, i) => {
        if (i === index) {
          const newQuantity = type === "increase" ? product[field] + 1 : Math.max(product[field] - 1, 0);
  
          if (field === "quantity" && newQuantity === 0) {
            return {
              ...product,
              quantity: 0,
              expanded: false,
              siteItems: null,
              images: [],
            };
          }
  
          return {
            ...product,
            [field]: newQuantity,
            expanded: field === "quantity" ? (type === "increase" ? true : product[field] > 1) : product.expanded,
          };
        }
        return product;
      })
    );
  };

  const handleSiteItemsChange = (index, value) => {
    setProductData((prevProducts) =>
      prevProducts.map((product, i) =>
        i === index ? { ...product, siteItems: value } : product
      )
    );
  };



  

  const handleClosePopup = () => {
    setSessionExpired(false);
    navigate("/");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  function getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString("en-GB", { hour12: false });
  }

  function getFormattedDate() {
    const now = new Date();
    const options = { month: "long", day: "numeric", year: "numeric" };
    let formattedDate = now.toLocaleDateString("en-US", options);

    const day = now.getDate();
    const suffix = ["TH", "ST", "ND", "RD"][
      day % 10 > 3 || (day >= 11 && day <= 13) ? 0 : day % 10
    ];
    formattedDate = formattedDate.replace(/\d+/, day + suffix);

    return formattedDate.toUpperCase();
  }

  if (!isMobile) {
    return (
      <div className="warning-screen">
        <h1>This page is only accessible on <span className="indigo-blue">mobile devices</span>.</h1>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    let newErrors = {};
    let isValid = true;
  
    // Validate cleaner's email
    if (!cleanerEmail.trim()) {
      newErrors.cleanerEmail = "Cleaner's email is required.";
      isValid = false;
    }
  
    // Validate room images (must be exactly 5)
    if (roomImages.length !== 5) {
      newErrors.roomImages = "You must upload exactly 5 images of the cleaner's room.";
      isValid = false;
    }
  
    // Validate product data
    const updatedProductData = productData
      .map((product, index) => {
        if (product.quantity > 0) {
          const hasError =
            product.availableQuantity === 0 ||
            product.siteItems === null ||
            product.images.length === 0;
  
          if (hasError) {
            isValid = false;
            newErrors[index] = "All fields are required for selected products.";
          }
        }
        return product;
      })
      .filter((product) => product.quantity > 0); // Remove products where quantity is 0
  
    setErrors(newErrors);
  
    if (isValid) {
      console.log("Final order data:", {
        cleanerEmail,
        roomImages,
        products: updatedProductData,
      });
  
      // Proceed with order submission
    }
  };




  return (
    <div className="cleaner-order-container">
      <div className="site-data">
        <div className="site-data-container">
          <div className="time-display siteTimer" style={{ color: "#FFFFFF" }}>{currentTime}</div>
          <div className="site">
            {siteData ? (
              <>
                <h1>{siteData.organization_name}</h1>
                <p>{siteData.organization_name} - {siteData.site_name}</p>
              </>
            ) : (
              <h1>Loading...</h1>
            )}
          </div>
          <div className="date-display" style={{ color: "#FFFFFF" }}>
            <MdOutlineCalendarToday style={{ fontSize: "1.1rem" }} />
            <p>{selectedDate}</p>
          </div>
          <div className="cleaner-email">
            <label htmlFor="cleanerEmail">Cleaner's Email</label>
            <input type="email" placeholder="Enter your email" id="cleanerEmail" value={cleanerEmail} onChange={handleCleanerEmailChange}/>
            {errors.cleanerEmail && (
                  <p className="error-message">{errors.cleanerEmail}</p>
                )} 
          </div>
        </div>
      </div>

      <div className="product-list">
        {productData.length > 0 ? (
          productData.map((product, index) => (
            <div key={product._id} className="product-tile">
              <div className="product-initial-info">
              <img src={product.product_image} alt={product.product_name} className="product-image"/>
              <div className="product-info">
                <h3>{product.product_name}</h3>
                <p>ID-{product.product_id}</p>
                <div className="product-quantity-container">
                  <button className="quantity-btn" onClick={() => handleQuantityChange(index, "increase", "quantity")}><FaPlus className="quantity-logo"/></button>
                  <p style={{color:"#000", fontSize:"1rem"}}>{product.quantity}</p>
                  <button className="quantity-btn" onClick={() => handleQuantityChange(index, "decrease", "quantity")}><FaMinus className="quantity-logo"/></button>
                </div>
              </div>
              </div>
              {product.expanded && (
                  <div className="expanded-details">
                    <hr className="expanded-line"/>
                    <div className="expanded-first-row">
                      <div className="already-container">
                        <p>Items already on site</p>
                        <div className="yes-no-container">
                          <button
                            onClick={() => handleSiteItemsChange(index, "yes")}
                            className={`yes-no-btn ${productData[index].siteItems === "yes" ? "active" : ""}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleSiteItemsChange(index, "no")}
                            className={`yes-no-btn ${productData[index].siteItems === "no" ? "active" : ""}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    
                      <div className="available-container">
                        <p>Items available</p>
                        <div className="product-quantity-container" style={{marginTop:"0.5rem"}}>
                          <button className="quantity-btn" onClick={() => handleQuantityChange(index, "increase", "availableQuantity")}><FaPlus /></button>
                          <p style={{color:"#000", fontSize:"1rem"}}>{product.availableQuantity}</p>
                          <button className="quantity-btn" onClick={() => handleQuantityChange(index, "decrease", "availableQuantity")}><FaMinus /></button>
                        </div>
                      </div>
                    </div>

                    <div className="upload-photo-container">
                      <p>Upload Images of item</p>
                    <button 
                      className="capture-button" 
                      onClick={() => {
                        setShowCameraPopup(true);
                        setCapturedProductImages([]); // Reset product images
                        setCurrentProductIndex(index); // Track which product we're capturing for
                        setIsRoomImageCapture(false); // Ensure this is not for room images
                      }}
                    >
                      Add media
                    </button>
                    </div>
                    
                    
                    
                    {product.images.length > 0 && (
                      <div className="image-preview-container">
                        <p>Preview of images clicked</p>
                        <div className="image-preview">
                          {product.images.map((img, imgIdx) => (
                            <img 
                              key={imgIdx} 
                              src={typeof img === "string" ? img : URL.createObjectURL(img)} 
                              alt="Captured" 
                              onClick={() => removeImage(index, imgIdx)} 
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                )}
                {errors[index] && (
                  <p className="error-message">{errors[index]}</p>
                )}    
            </div>
          ))
        ) : (
          <p>Loading products...</p>
        )}
      </div>

      <div className="upload-room-photo-container">
        <p style={{color:"#000"}}>Upload Images of the Cleaner’s Room</p>
        <button 
          className="capture-button" 
          onClick={() => {
            setShowCameraPopup(true);
            setRoomImages([]); // Reset room images
            setIsRoomImageCapture(true); // Set flag for room images
          }}
          disabled={roomImages.length >= 5}
        >
          Add media
        </button>

        {roomImages.length > 0 && (
          <div className="room-image-preview-container">
            <p>Preview of Room Images</p>
            <div className="room-image-grid">
              {roomImages.map((img, imgIdx) => (
                <img 
                  key={imgIdx} 
                  src={img} 
                  alt="Cleaner Room" 
                  onClick={() => removeRoomImage(imgIdx)}
                  className="room-image"
                />
              ))}
            </div>
          </div>
        )}
        {errors.roomImages && (
                  <p className="error-message">{errors.roomImages}</p>
                )} 
      </div>

      {showCameraPopup && (
  <div className="camera-popup">
    <div className="camera-container">
      <video ref={videoRef} autoPlay playsInline className="camera"></video>
      <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

      <button
        onClick={handleCaptureImage}
        disabled={
          isRoomImageCapture
            ? roomImages.length >= 5 // Disable if room images reach 5
            : capturedProductImages.length >= 2 // Disable if product images reach 2
        }
        className="camera-button"
      >
        Capture
      </button>

      <button
        onClick={() => {
          setShowCameraPopup(false);
          if (isRoomImageCapture) {
            setIsRoomImageCapture(false); // Reset room image capture flag
          } else {
            setCurrentProductIndex(null); // Reset product index
          }
        }}
        className="camera-button"
        style={{ backgroundColor: "#D9D9D9", color: "#000", marginLeft: "1rem" }}
      >
        Done
      </button>
    </div>
  </div>
)}


      <button className="submit-button" onClick={handlePlaceOrder}>Place order</button>
      <button className="logout-button" onClick={handleLogout}>Logout</button>

      {sessionExpired && (
        <div className="session-expired-popup">
          <div className="popup-content">
            <h2>Session Expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button onClick={handleClosePopup}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CleanerOrder;
