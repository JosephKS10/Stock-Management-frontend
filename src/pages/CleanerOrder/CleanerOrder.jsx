import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/CleanerAuthContext";
import { useNavigate } from "react-router-dom";
import "./CleanerOrder.css";
import { MdOutlineCalendarToday, MdOutlineVerified } from "react-icons/md";
import { FaPlus, FaMinus } from "react-icons/fa6";
import { fetchSiteData, fetchProductData, uploadImageToS3, createCleanerOrder } from "../../utils/api"; // Import the utility functions


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

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderResponse, setOrderResponse] = useState(null);

  const [currentCamera, setCurrentCamera] = useState('environment'); 
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // validation and Error handling
  const [errors, setErrors] = useState({});

  const handleCleanerEmailChange = (event) => {
    setCleanerEmail(event.target.value);
};


useEffect(() => {
  const checkCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error("Error enumerating devices:", error);
    }
  };
  
  checkCameras();
}, []);

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
        .getUserMedia({ 
          video: { facingMode: currentCamera } 
        })
        .then((stream) => {
          setVideoStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err);
          // Fallback to default camera if preferred fails
          navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
              setVideoStream(stream);
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
              }
            })
            .catch((fallbackErr) => console.error("Fallback camera error:", fallbackErr));
        });
    } else {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    }
  }, [showCameraPopup, currentCamera]); 

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



  const handlePlaceOrder = async () => {
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
      .filter((product) => product.quantity > 0);
  
    setErrors(newErrors);
  
    if (isValid) {
      try {
        setIsSubmitting(true);
        setUploadProgress(0);
  
        // Calculate total images to upload
        const productImagesTotal = updatedProductData.reduce(
          (total, product) => total + product.images.length, 0
        );
        const totalImages = roomImages.length + productImagesTotal;
        let uploadedCount = 0;
  
        // 1. First upload room photos
        const roomImageUrls = [];
        for (let i = 0; i < roomImages.length; i++) {
          const response = await uploadImageToS3(roomImages[i], 'room-photos', authToken);
          roomImageUrls.push(response.imageUrl);
          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalImages) * 100));
        }
  
        // 2. Upload product photos
        const productsWithUrls = await Promise.all(
          updatedProductData.map(async (product) => {
            const imageUrls = [];
            for (const img of product.images) {
              const response = await uploadImageToS3(img, 'product-photos', authToken);
              imageUrls.push(response.imageUrl);
              uploadedCount++;
              setUploadProgress(Math.round((uploadedCount / totalImages) * 100));
            }
            return {
              ...product,
              item_photos: imageUrls
            };
          })
        );
  
        // 3. Submit final order
        const orderData = {
          site_info: {
            site_id: siteData._id,
            site_name: siteData.site_name,
            organization_name: siteData.organization_name,
            location: siteData.location,
          },
          cleaner_email: cleanerEmail,
          order_items: productsWithUrls.map(p => ({
            product_id: p._id,
            product_name: p.product_name,
            product_image: p.product_image,
            product_type: p.product_type,
            quantity: p.quantity,
            item_available_on_site: p.availableQuantity,
            item_already_on_site: p.siteItems,
            item_photos: p.item_photos
          })),
          cleaner_room_photos: roomImageUrls
        };
  
        console.log(orderData);
        const orderResponse = await createCleanerOrder(orderData, authToken);
        setOrderResponse(orderResponse);
        setOrderSuccess(true);
     
        
      } catch (error) {
        console.error("Order submission failed:", error);
        setErrors({ submit: error.message });
      } finally {
        setIsSubmitting(false);
        setUploadProgress(0);
      }
    }
  };

  const toggleCamera = async () => {
    try {
      // Stop the current stream
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
  
      // Get the new camera
      const newCamera = currentCamera === 'user' ? 'environment' : 'user';
      setCurrentCamera(newCamera);
  
      // Start the new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newCamera }
      });
      
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error switching camera:", error);
      // Fallback to default camera if switching fails
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
        setVideoStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (fallbackError) {
        console.error("Fallback camera error:", fallbackError);
      }
    }
  };


  return (
    <div className="cleaner-order-container">
      <div className="site-data">
        <div className="site-data-container">
          <div className="time-display siteTimer" style={{ color: "#FFFFFF" }}>{currentTime}</div>
          <div className="site">
            <div className="details">
            {siteData ? (
              <>
                <h1>{siteData.organization_name}</h1>
                <p>{siteData.organization_name} - {siteData.site_name}</p>
              </>
            ) : (
              <h1>Loading...</h1>
            )}
            </div>
            <div className="logout-btn">
              <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
           
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
                            onClick={() => handleSiteItemsChange(index, "true")}
                            className={`yes-no-btn ${productData[index].siteItems === "true" ? "active" : ""}`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleSiteItemsChange(index, "false")}
                            className={`yes-no-btn ${productData[index].siteItems === "false" ? "active" : ""}`}
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

      <div className="camera-controls">
              {hasMultipleCameras && (
          <button
            onClick={toggleCamera}
            className="camera-switch-button"
            title="Switch Camera"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
              <path d="M12 17l1.25-2.75L16 13l-2.75-1.25L12 9l-1.25 2.75L8 13l2.75 1.25z"/>
            </svg>
          </button>
        )}

        <button
          onClick={handleCaptureImage}
          disabled={
            isRoomImageCapture
              ? roomImages.length >= 5
              : capturedProductImages.length >= 2
          }
          className="camera-button"
        >
          Capture
        </button>

        <button
          onClick={() => {
            setShowCameraPopup(false);
            if (isRoomImageCapture) {
              setIsRoomImageCapture(false);
            } else {
              setCurrentProductIndex(null);
            }
          }}
          className="camera-button"
          style={{ backgroundColor: "#D9D9D9", color: "#000" }}
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}

      <div className="submit-btn-container">
      <button className="submit-button" onClick={handlePlaceOrder}>Place order</button>
      </div>

          {isSubmitting && (
      <div className="upload-progress-container">
        <div className="upload-progress-bar-container">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        <div className="upload-progress-text">
          <div className="upload-progress-spinner"></div>
          Uploading {Math.round(uploadProgress)}% complete
        </div>
      </div>
    )}

{orderSuccess && (
  <div className="order-confirmation-popup">
    <div className="popup-content">
      <div className="success-icon"><MdOutlineVerified/></div>
      <h1>Order Placed Successfully</h1>
      <div className="order-details">
        <p><strong>Order ID:</strong> {orderResponse.order._id}</p>
        <p><strong>Status:</strong> {(orderResponse.order.order_status).toUpperCase()}</p>
      </div>

      <div className="popup-actions">
        <button 
          className="popup-button secondary"
          onClick={() => {
            setOrderSuccess(false);
            navigate(0);
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

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
