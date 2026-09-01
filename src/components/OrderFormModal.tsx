import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  MapPin, 
  Truck, 
  FolderOpen, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Loader2,
  Trash2,
  HelpCircle,
  Link,
  Copy,
  Check
} from 'lucide-react';
import { PRODUCTS, INITIAL_ORDERS } from '../utils/data';
import { useToast } from './Toast';
import Swal from 'sweetalert2';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReorderItem?: { productName: string; quantity: number; notes: string } | null;
}

export default function OrderFormModal({ isOpen, onClose, initialReorderItem }: OrderFormModalProps) {
  const { toast } = useToast();
  
  // Storage key configurations
  const STORAGE_KEY = 'jkm_web3forms_key_v2';
  const DEFAULT_EMAIL = 'jkmprimedigitalprints@gmail.com';

  // State definitions
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'Store Pickup' | 'Customer Books Courier'>('Store Pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedCourier, setSelectedCourier] = useState('Lalamove');
  
  const [productOrdered, setProductOrdered] = useState(PRODUCTS[0]?.name || 'Customized Mugs');
  const [orderDescription, setOrderDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [designLink, setDesignLink] = useState('');

  // Auto pre-fill when reordering past item
  React.useEffect(() => {
    if (initialReorderItem) {
      setProductOrdered(initialReorderItem.productName);
      setQuantity(initialReorderItem.quantity.toString());
      setOrderDescription(initialReorderItem.notes);
    }
  }, [initialReorderItem]);

  // Pre-fill registered customer info if logged in
  React.useEffect(() => {
    if (isOpen) {
      const activeSession = localStorage.getItem('jkm_active_customer_session');
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          if (parsed.name) setCustomerName(parsed.name);
          if (parsed.phone) setContactNumber(parsed.phone);
          if (parsed.email) setCustomerEmail(parsed.email);
          if (parsed.address) setDeliveryAddress(parsed.address);
        } catch (err) {
          console.warn('Failed to load active session in order form:', err);
        }
      }
    }
  }, [isOpen]);
  
  // New upgraded states
  const [printFinish, setPrintFinish] = useState<'glossy' | 'matte' | 'leather' | 'glitters'>('glossy');
  const [isRush, setIsRush] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Bank Transfer'>('GCash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<string>('');

  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; url: string; size: number; isPdf: boolean }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  // Web3Forms access key constant
  const web3formsKey = '178d3c8e-3c51-4de4-a569-b08531821429';

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [submittedOrderSummary, setSubmittedOrderSummary] = useState('');

  // Draft handlers
  const saveDraft = () => {
    const draft = {
      customerName,
      contactNumber,
      customerEmail,
      deliveryMethod,
      deliveryAddress,
      selectedCourier,
      productOrdered,
      orderDescription,
      quantity,
      additionalInstructions,
      designLink,
      printFinish,
      isRush,
      paymentMethod,
      paymentRef
    };
    localStorage.setItem('jkm_order_form_draft_v2', JSON.stringify(draft));
    toast.success('Order form draft saved successfully!');
  };

  const loadDraft = () => {
    const saved = localStorage.getItem('jkm_order_form_draft_v2');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.customerName) setCustomerName(draft.customerName);
        if (draft.contactNumber) setContactNumber(draft.contactNumber);
        if (draft.customerEmail) setCustomerEmail(draft.customerEmail);
        
        // Handle backwards-compatible delivery state
        if (draft.deliveryMethod) {
          if (draft.deliveryMethod === 'pickup') {
            setDeliveryMethod('Store Pickup');
          } else if (draft.deliveryMethod === 'delivery') {
            setDeliveryMethod('Customer Books Courier');
          } else {
            setDeliveryMethod(draft.deliveryMethod);
          }
        }
        
        if (draft.deliveryAddress) setDeliveryAddress(draft.deliveryAddress);
        if (draft.selectedCourier) setSelectedCourier(draft.selectedCourier);
        if (draft.productOrdered) setProductOrdered(draft.productOrdered);
        if (draft.orderDescription) setOrderDescription(draft.orderDescription);
        if (draft.quantity) setQuantity(draft.quantity);
        if (draft.additionalInstructions) setAdditionalInstructions(draft.additionalInstructions);
        if (draft.designLink) setDesignLink(draft.designLink);
        
        // Handle backwards-compatible lamination state
        if (draft.printFinish) {
          setPrintFinish(draft.printFinish);
        } else if (draft.lamination) {
          if (draft.lamination === 'none') setPrintFinish('glossy');
          else if (draft.lamination === 'glitter') setPrintFinish('glitters');
          else setPrintFinish(draft.lamination);
        }
        
        if (draft.isRush !== undefined) setIsRush(draft.isRush);
        if (draft.paymentMethod) setPaymentMethod(draft.paymentMethod);
        if (draft.paymentRef) setPaymentRef(draft.paymentRef);
        toast.success('Form draft loaded!');
      } catch (e) {
        toast.error('Failed to restore draft.');
      }
    } else {
      toast.info('No draft found to resume.');
    }
  };

  // Live Price calculations
  const matchedProduct = PRODUCTS.find(p => 
    p.name.toLowerCase().includes(productOrdered.toLowerCase()) || 
    productOrdered.toLowerCase().includes(p.name.toLowerCase())
  ) || PRODUCTS[0];

  const qtyNum = parseInt(quantity) || 1;
  const basePrice = matchedProduct ? matchedProduct.basePrice : 100;
  
  // "Online Order Form = POS Price - ₱5 per item."
  // Exceptions: Document Printing and Photo Printing retain original POS prices (no -₱5).
  const isException = matchedProduct && (
    matchedProduct.category === 'Document Printing' || 
    matchedProduct.category === 'Photo Printing' ||
    matchedProduct.name.toLowerCase().includes('document') ||
    matchedProduct.name.toLowerCase().includes('photo printing')
  );
  
  const discount = isException ? 0 : 5;
  const productPrice = Math.max(0, basePrice - discount);
  
  // Matte, Leather, and Glitters finishes each incur a +₱10 charge. Glossy is default (+0).
  const finishPrice = printFinish === 'glossy' ? 0 : 10;
  
  const calculatedSubtotal = (productPrice + finishPrice) * qtyNum;
  const deliveryPrice = 0; // Logistics fee is completely removed
  const rushPrice = isRush ? 150 : 0;
  
  const calculatedGrandTotal = calculatedSubtotal + rushPrice;
  const calculatedDP = Math.round(calculatedGrandTotal / 2);
  const calculatedRemaining = calculatedGrandTotal - calculatedDP;

  // Estimated Production Time Computation
  const getEstimatedProductionTime = () => {
    if (isRush) return '1 to 4 hours (Priority Rush)';
    if (productOrdered.toLowerCase().includes('shirt') || productOrdered.toLowerCase().includes('jacket')) {
      return '2 to 3 Business Days';
    }
    if (productOrdered.toLowerCase().includes('mug') || productOrdered.toLowerCase().includes('tumbler')) {
      return '1 to 2 Business Days';
    }
    if (productOrdered.toLowerCase().includes('id') || productOrdered.toLowerCase().includes('photo')) {
      return '24 Hours';
    }
    return '1 to 2 Business Days';
  };

  // File inputs refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Constants
  const COURIERS = ['Lalamove', 'Joyride', 'Grab', 'J&T Express'];
  const PICKUP_LOCATION = 'GHQ Road, South Signal Village, Taguig City';
  const MAX_FILE_COUNT = 15;
  const MAX_TOTAL_SIZE_MB = 10; // Web3Forms free tier total size limit is 10MB

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Add files to lists
  const handleAddFiles = (filesList: FileList | null) => {
    if (!filesList) return;
    
    const newFiles = Array.from(filesList);
    const validFiles: File[] = [];
    const duplicates: string[] = [];

    // Filter file types (PNG, JPG, JPEG, PDF)
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'pdf'];
    
    for (const file of newFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!allowedExtensions.includes(ext)) {
        toast.error(`Invalid format: ${file.name}. Only PNG, JPG, JPEG, and PDF are allowed.`);
        continue;
      }
      
      // Check for duplicate names
      if (uploadedFiles.some(f => f.name === file.name)) {
        duplicates.push(file.name);
        continue;
      }

      validFiles.push(file);
    }

    if (duplicates.length > 0) {
      toast.warning(`Skipped duplicates: ${duplicates.join(', ')}`);
    }

    // Check total count limit
    if (uploadedFiles.length + validFiles.length > MAX_FILE_COUNT) {
      toast.error(`You can only upload up to ${MAX_FILE_COUNT} files.`);
      return;
    }

    // Check total size
    const totalCurrentSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
    const totalNewSize = validFiles.reduce((acc, f) => acc + f.size, 0);
    const overallSizeMB = (totalCurrentSize + totalNewSize) / (1024 * 1024);

    if (overallSizeMB > MAX_TOTAL_SIZE_MB) {
      toast.error(`Total file size exceeds ${MAX_TOTAL_SIZE_MB}MB. Please upload smaller images or compress your files.`);
      return;
    }

    // Generate previews and add
    const updatedFiles = [...uploadedFiles, ...validFiles];
    setUploadedFiles(updatedFiles);

    const newPreviews = validFiles.map(file => {
      const isPdf = file.name.split('.').pop()?.toLowerCase() === 'pdf';
      return {
        name: file.name,
        url: isPdf ? '' : URL.createObjectURL(file),
        size: file.size,
        isPdf
      };
    });

    setFilePreviews(prev => [...prev, ...newPreviews]);
    toast.success(`Added ${validFiles.length} file(s).`);
  };

  // Drag over handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...uploadedFiles];
    const updatedPreviews = [...filePreviews];
    
    // Revoke object URL to avoid memory leak
    if (!updatedPreviews[index].isPdf) {
      URL.revokeObjectURL(updatedPreviews[index].url);
    }

    updatedFiles.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    setUploadedFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
    toast.info('File removed.');
  };



  // Form submission handler
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim()) {
      toast.error('Please enter your full name.');
      return;
    }
    if (!contactNumber.trim()) {
      toast.error('Please enter your contact number.');
      return;
    }
    if (deliveryMethod === 'Customer Books Courier' && !deliveryAddress.trim()) {
      toast.error('Please enter your complete delivery address for courier booking.');
      return;
    }
    if (!orderDescription.trim()) {
      toast.error('Please enter a description/specifications of your order.');
      return;
    }
    // Design link and file uploads are fully optional per requirements.

    const activeKey = web3formsKey;
    const generatedId = `JKM-ONLINE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    setIsSubmitting(true);
    toast.info('Processing your order details...');

    // 1. Create and Save order details to local database history ('jkm_orders_v2') immediately
    try {
      const finalProduct = {
        ...matchedProduct,
        name: `${matchedProduct.name} (${printFinish.toUpperCase()} finish${isRush ? ' • RUSH' : ''})`
      };

      const finalSubtotal = calculatedSubtotal;
      const finalGrandTotal = calculatedGrandTotal;
      const finalDP = paymentRef ? calculatedDP : 0;
      const finalRemaining = finalGrandTotal - finalDP;

      setSubmittedOrderId(generatedId);

      const newPOSOrder = {
        id: generatedId,
        customerName: customerName.trim(),
        customerContact: contactNumber.trim(),
        customerEmail: customerEmail.trim() || undefined,
        date: new Date().toLocaleDateString('en-CA'),
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        items: [{
          id: `item-${Math.random().toString(36).substring(2, 7)}`,
          product: finalProduct,
          quantity: qtyNum,
          notes: `Finish: ${printFinish.toUpperCase()}. ${orderDescription.trim()}`,
          subtotal: finalSubtotal
        }],
        subtotal: finalSubtotal,
        discount: 0,
        grandTotal: finalGrandTotal,
        paymentType: paymentRef ? 'Pending Payment Verification' as const : 'Pending - Waiting for Payment' as const,
        paymentMethod: paymentMethod,
        downPaymentAmount: finalDP,
        remainingBalance: finalRemaining,
        amountPaid: finalDP,
        change: 0,
        status: 'Pending' as const,
        notes: `[Online Web Order]\nPrint Finish: ${printFinish.toUpperCase()}\nIs Rush Job: ${isRush ? 'YES' : 'NO'}\nPayment Reference: ${paymentRef || 'N/A'}\nDelivery Method: ${deliveryMethod}\nCourier Choice: ${deliveryMethod === 'Customer Books Courier' ? selectedCourier : 'N/A'}\nDelivery Location/Meetup: ${deliveryMethod === 'Store Pickup' ? PICKUP_LOCATION : deliveryAddress}\nAdditional Instructions: ${additionalInstructions || 'None'}\nDesign Link: ${designLink.trim() || 'None'}\nAttachments: ${uploadedFiles.length} file(s) attached.`,
        deliveryMethod: deliveryMethod,
        deliveryAddress: deliveryMethod === 'Store Pickup' ? undefined : deliveryAddress,
        selectedCourier: deliveryMethod === 'Customer Books Courier' ? selectedCourier : undefined,
        additionalInstructions: additionalInstructions || undefined,
        designLink: designLink.trim() || undefined,
        trackingNumber: generatedId,
        trackingUpdates: [
          {
            status: 'Pending' as const,
            timestamp: `${new Date().toLocaleDateString('en-CA')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
            note: paymentRef 
              ? `Your online order request has been registered with GCash/Bank Reference Number ${paymentRef}. Awaiting admin payment verification.` 
              : 'Your online order request has been registered. Please upload your GCash/Bank downpayment reference to begin production.',
            images: []
          }
        ]
      };

    const savedOrders = localStorage.getItem('jkm_orders_v2');
    const ordersList = savedOrders ? JSON.parse(savedOrders) : INITIAL_ORDERS;
    localStorage.setItem('jkm_orders_v2', JSON.stringify([newPOSOrder, ...ordersList]));

    // Log action
    const savedLogs = localStorage.getItem('jkm_user_logs_v2');
    const logs = savedLogs ? JSON.parse(savedLogs) : [];
    const newLog = {
      id: `LOG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      user: `Customer (${customerName})`,
      action: `Submitted online order request for ${productOrdered} (Qty: ${quantity || 1})`,
      date: new Date().toLocaleDateString('en-CA'),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    localStorage.setItem('jkm_user_logs_v2', JSON.stringify([newLog, ...logs]));

    // 1.1 Real-time Firestore synchronizer for JKM Admin Portal
    try {
      const sanitizeForFirestore = (obj: any): any => {
        if (obj === null || obj === undefined) return null;
        if (Array.isArray(obj)) {
          return obj.map(sanitizeForFirestore);
        }
        if (typeof obj === 'object') {
          const cleaned: any = {};
          for (const key of Object.keys(obj)) {
            if (obj[key] !== undefined) {
              cleaned[key] = sanitizeForFirestore(obj[key]);
            }
          }
          return cleaned;
        }
        return obj;
      };

      const cleanPOSOrder = sanitizeForFirestore(newPOSOrder);
      const cleanLog = sanitizeForFirestore(newLog);

      await setDoc(doc(db, 'orders', generatedId), cleanPOSOrder);
      await setDoc(doc(db, 'user_logs', newLog.id), cleanLog);
      console.log('Successfully saved online order and log to Firestore:', generatedId);
    } catch (fsErr) {
      console.error('Failed to sync order/log to Firestore database:', fsErr);
    }
  } catch (localErr) {
    console.error('Failed to save order to local database history:', localErr);
  }

  // 2. Submit via fetch to Web3Forms API in the background (Non-blocking)
  try {
    // Build FormData payload for Web3Forms (Multipart/Form-Data supports attachments!)
    const formData = new FormData();
    formData.append('access_key', activeKey);
    formData.append('subject', `ORDER CONFIRMATION: ${generatedId} - ${customerName}`);
    formData.append('from_name', 'JKM Prime Digital Prints');
    formData.append('name', customerName);
    formData.append('email', customerEmail.trim() || DEFAULT_EMAIL); // CC/forward to user if entered, fallback otherwise

    // Content text
    const mailBody = `
=========================================
     ORDER CONFIRMATION & RECEIPT
=========================================
Dear ${customerName},

Thank you for your order request with JKM Prime Digital Prints!
We have received your specifications and our graphics and production team is already reviewing your request.

ORDER INVOICE: ${generatedId}
TRACKING CODE: ${generatedId}
STATUS: Order Received

You can track your order status live, view proofs, or check updates at any time by entering your tracking code in our online portal!

-----------------------------------------
CUSTOMER DETAILS:
- Name: ${customerName}
- Contact Number: ${contactNumber}
- Contact Email: ${customerEmail || 'Not Provided'}

SHIPPING & LOGISTICS:
- Delivery Method: ${deliveryMethod}
- Location/Address: ${deliveryMethod === 'Store Pickup' ? PICKUP_LOCATION : deliveryAddress}
- Courier Agency: ${deliveryMethod === 'Customer Books Courier' ? selectedCourier : 'N/A'}

PRODUCT DETAILS:
- Item Selected: ${productOrdered}
- Quantity Requested: ${quantity || '1'}
- Specs / Description:
${orderDescription}

ADDITIONAL INSTRUCTIONS:
${additionalInstructions || 'None'}

DESIGN CLOUD LINK:
${designLink.trim() || 'No Link Provided'}

ATTACHMENTS:
- Total Attached Files: ${uploadedFiles.length}
- File List: ${uploadedFiles.map(f => `${f.name} (${formatBytes(f.size)})`).join(', ') || 'No attachments'}
=========================================
Precision Printing. Premium Quality. Quick Turnaround.
JKM PRIME DIGITAL PRINTS CO.
`;

    formData.append('message', mailBody);
    setSubmittedOrderSummary(mailBody);

    // Custom fields so Web3Forms formats them in the submission details list
    formData.append('Customer Name', customerName);
    formData.append('Contact Number', contactNumber);
    formData.append('Delivery Method', deliveryMethod);
    formData.append('Delivery Address', deliveryMethod === 'Store Pickup' ? PICKUP_LOCATION : deliveryAddress);
    formData.append('Courier Choice', deliveryMethod === 'Customer Books Courier' ? selectedCourier : 'N/A');
    formData.append('Product Ordered', productOrdered);
    formData.append('Order Description', orderDescription);
    formData.append('Quantity', quantity || '1');
    formData.append('Additional Instructions', additionalInstructions || 'None');
    formData.append('Design Link / Cloud URL', designLink.trim() || 'None');

      // Web3Forms binary attachments are a premium/PRO feature.
      // To keep the form submission 100% free and avoid PRO errors, we omit appending the physical files.
      // The file names and sizes are already listed in the 'message' body text for the business owner.

      // Dispatch fetch in the background and do not block the UI
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      })
      .then(async (response) => {
        if (response) {
          const resData = await response.json();
          if (response.ok && resData.success) {
            toast.success('Order confirmation email sent successfully!');
          } else {
            console.warn('Web3Forms success was false:', resData);
            const errorMsg = resData.message || 'Key configuration pending or inactive';
            
            if (
              errorMsg.toLowerCase().includes('activate') || 
              errorMsg.toLowerCase().includes('verified') || 
              errorMsg.toLowerCase().includes('confirm') ||
              errorMsg.toLowerCase().includes('register')
            ) {
              Swal.fire({
                title: 'Email Forwarder Key Inactive',
                html: `Your order was saved inside the portal system database, but the email forwarding to <strong>${DEFAULT_EMAIL}</strong> failed because:<br/><br/>
                <span class="text-red-500 font-bold font-mono text-xs">"${errorMsg}"</span><br/><br/>
                Please open the inbox of <strong>${DEFAULT_EMAIL}</strong>, look for the verification email sent by <strong>Web3Forms</strong>, and click the activation link to enable instant email forwarding!`,
                icon: 'warning',
                confirmButtonColor: '#0ea5e9'
              });
            } else {
              toast.warning(`Email forwarder: ${errorMsg}`);
            }
          }
        }
      })
      .catch((fetchErr) => {
        console.warn('Background email forwarder error:', fetchErr);
      });

    } catch (err: any) {
      console.error('Background dispatch setup error:', err);
    }

    // Instantly transition to the success screen! No waiting on network/loading.
    setIsSubmittedSuccess(true);
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-900 px-6 py-5 flex items-center justify-between text-white border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg bg-white/10 p-0.5" />
              <div>
                <h3 className="font-sans font-black text-sm tracking-wide uppercase">Order Form Portal</h3>
                <p className="text-[10px] font-mono tracking-widest text-sky-400 font-bold leading-none mt-1">JKM Prime Digital Prints</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

            {!isSubmittedSuccess ? (
              <form onSubmit={handleSubmitOrder} className="space-y-6">

                {/* Draft Actions Bar */}
                <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-3.5 rounded-2xl">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-black text-slate-500">Unsubmitted Draft Progress</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={loadDraft}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      Resume Draft
                    </button>
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      Save Draft
                    </button>
                  </div>
                </div>
                
                {/* 1. CUSTOMER INFORMATION */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="h-5 w-1 bg-sky-500 rounded-full" />
                    <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">1. Customer Information</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Full Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Juan Dela Cruz"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Contact Number *</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="0917XXXXXXX"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Email (For Notifications)</label>
                      <input 
                        type="email" 
                        placeholder="juandelacruz@gmail.com"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. DELIVERY METHOD */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="h-5 w-1 bg-sky-500 rounded-full" />
                    <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">2. Delivery / Logistics Method</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('Store Pickup');
                        setDeliveryAddress('');
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        deliveryMethod === 'Store Pickup' 
                          ? 'border-sky-500 bg-sky-50/40 text-sky-600 shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-center">Store Pickup</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMethod('Customer Books Courier');
                        setDeliveryAddress('');
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                        deliveryMethod === 'Customer Books Courier' 
                          ? 'border-sky-500 bg-sky-50/40 text-sky-600 shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Truck className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-center">Courier Shipping</span>
                    </button>
                  </div>

                  {/* Pickup Info Alert */}
                  {deliveryMethod === 'Store Pickup' && (
                    <div className="bg-white border border-slate-100 p-4 rounded-xl flex gap-3 items-start">
                      <MapPin className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold block">Pickup Studio Location</span>
                        <p className="text-slate-700 text-xs font-semibold leading-relaxed">{PICKUP_LOCATION}</p>
                      </div>
                    </div>
                  )}

                  {/* Courier Inputs */}
                  {deliveryMethod === 'Customer Books Courier' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-1 overflow-hidden"
                    >
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Delivery Address *</label>
                        <textarea
                          required
                          rows={2}
                          placeholder="Complete Destination Address with Landmarks..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Preferred Courier *</label>
                          <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Customer Books and Pays Courier</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {COURIERS.map(courier => (
                            <button
                              key={courier}
                              type="button"
                              onClick={() => setSelectedCourier(courier)}
                              className={`py-2 px-3 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                selectedCourier === courier
                                  ? 'border-sky-500 bg-sky-50 text-sky-600 shadow-xs font-extrabold'
                                  : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                                {courier}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* 3. ORDER DETAILS */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="h-5 w-1 bg-sky-500 rounded-full" />
                    <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">3. Order Details</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-8 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Product or Service Ordered *</label>
                      <select
                        value={productOrdered}
                        onChange={(e) => setProductOrdered(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer font-bold"
                      >
                        {Array.from(new Set(PRODUCTS.map(p => p.category))).map(category => (
                          <optgroup key={category} label={category}>
                            {PRODUCTS.filter(p => p.category === category).map(product => {
                              const isException = category === 'Document Printing' || 
                                category === 'Photo Printing' ||
                                product.name.toLowerCase().includes('document') ||
                                product.name.toLowerCase().includes('photo printing');
                              const displayPrice = product.basePrice - (isException ? 0 : 5);
                              return (
                                <option key={product.id} value={product.name}>
                                  {product.name} (₱{displayPrice.toLocaleString()})
                                </option>
                              );
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4 space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity *</label>
                      <input 
                        type="number"
                        min="1"
                        required
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Order Specifications / Description *</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="e.g. White mug with floral layout and 'Teacher Sarah' print. High resolution, vibrant layout."
                      value={orderDescription}
                      onChange={(e) => setOrderDescription(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Additional Instructions (Optional)</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Please wrap carefully. Needs to be completed before Saturday event."
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors"
                    />
                  </div>

                  {/* Lamination and Rush Priority Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Surface Lamination Finish</label>
                      <select
                        value={printFinish}
                        onChange={(e: any) => setPrintFinish(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-colors cursor-pointer font-bold"
                      >
                        <option value="glossy">Glossy Protection (Default • No Charge)</option>
                        <option value="matte">Velvet Matte Finish (+₱15/pc)</option>
                        <option value="leather">Leather Texture Finish (+₱15/pc)</option>
                        <option value="glitters">Glitter Artistic Sparkle (+₱15/pc)</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 flex flex-col justify-end">
                      <div className="flex items-center gap-3 bg-white border border-slate-200 p-3.5 rounded-xl">
                        <input
                          type="checkbox"
                          id="isRush"
                          checked={isRush}
                          onChange={(e) => setIsRush(e.target.checked)}
                          className="h-4.5 w-4.5 text-sky-500 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                        />
                        <label htmlFor="isRush" className="select-none cursor-pointer">
                          <span className="block text-xs font-bold text-slate-900 uppercase">Priority Rush Processing</span>
                          <span className="block text-[10px] text-rose-500 font-bold uppercase mt-0.5">+₱150 Fee • Est. 1-4 hours completion!</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* LIVE PRICE BREAKDOWN & ESTIMATED PRODUCTION PANEL */}
                  <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-4.5 space-y-3">
                    <div className="flex justify-between items-center border-b border-sky-100/50 pb-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-sky-800">Dynamic Order Estimate</span>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-black">
                        {getEstimatedProductionTime()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                      <div>
                        <span className="text-slate-450 block text-[10px] uppercase tracking-wider">Product Cost</span>
                        <span className="font-mono text-slate-800 font-bold">₱{productPrice.toLocaleString()} x {quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] uppercase tracking-wider">Finish Fee ({printFinish.toUpperCase()})</span>
                        <span className="font-mono text-slate-800 font-bold">₱{finishPrice.toLocaleString()} x {quantity}</span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] uppercase tracking-wider">Logistic Fee</span>
                        <span className="font-mono text-slate-500 font-semibold italic text-[10px]">Excluded</span>
                      </div>
                      <div>
                        <span className="text-slate-450 block text-[10px] uppercase tracking-wider">Rush Priority</span>
                        <span className="font-mono text-slate-800 font-bold">₱{rushPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="border-t border-sky-100/60 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-sky-800 font-bold block">Estimated Grand Total Quote</span>
                        <span className="font-mono text-lg font-black text-slate-900">₱{calculatedGrandTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-right sm:text-right">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-700 font-bold block">50% Downpayment Required</span>
                        <span className="font-mono text-sm font-black text-emerald-600">₱{calculatedDP.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DESIGN LINK AND SHARING SETTINGS */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="h-5 w-1 bg-sky-500 rounded-full" />
                    <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">4. Provide Your Design Link</h4>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Link className="w-3.5 h-3.5 text-sky-500" />
                        Design Link or Cloud Folder URL (Optional)
                      </label>
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tracking-wider">Optional / Alternative</span>
                    </div>
                    <div className="relative">
                      <input 
                        type="url"
                        placeholder="Paste Google Drive, Canva, Dropbox, or Imgur link here..."
                        value={designLink}
                        onChange={(e) => setDesignLink(e.target.value)}
                        className="w-full bg-white border border-slate-200 pl-10 pr-4 py-3 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-semibold"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Link className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                    
                    {/* Share permissions instruction alert card */}
                    <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-xl space-y-1.5 leading-normal mt-2">
                      <p className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                        ⚠️ IMPORTANT SHARE SETTINGS NOTICE:
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium">
                        Please ensure that your link's sharing permissions are set to <strong className="text-amber-900">"Anyone with the link can view / access"</strong>. 
                        If the link is private, we will not be able to retrieve your design files, which will cause delays in your order production!
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      💡 <strong>Save time & bypass file limits!</strong> Paste a cloud folder or design project link. Our production staff can instantly fetch your high-resolution original artwork from the link.
                    </p>
                  </div>
                </div>

                 {/* 5. GCASH & MAYA DOWNPAYMENT PORTAL */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span className="h-5 w-1 bg-emerald-500 rounded-full" />
                    <h4 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">5. Instant Downpayment Portal (Optional)</h4>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-normal">
                    To expedite production, you may settle your 50% downpayment of <strong className="text-emerald-600">₱{calculatedDP.toLocaleString()}</strong> now via GCash or Bank Transfer and input the transaction details below.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('GCash')}
                      className={`py-3.5 rounded-xl border text-center text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'GCash'
                          ? 'border-blue-500 bg-blue-50/40 text-blue-600 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      GCash Wallet
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bank Transfer')}
                      className={`py-3.5 rounded-xl border text-center text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        paymentMethod === 'Bank Transfer'
                          ? 'border-violet-500 bg-violet-50/40 text-violet-600 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-violet-500" />
                      Bank Transfer
                    </button>
                  </div>

                  {/* QR details box */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="h-24 w-24 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                      <img 
                        src={paymentMethod === 'GCash' ? '/gqr.jpg' : '/bqr.jpg'} 
                        alt={`${paymentMethod} QR Code`}
                        className="w-full h-full object-contain p-1"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Fallback display if image is not yet uploaded by user
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="space-y-1 text-center sm:text-left">
                      <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 font-bold block">JKM Official Payment Merchant</span>
                      <h5 className="font-extrabold text-xs text-slate-900 uppercase">JKM PRIME DIGITAL PRINTS</h5>
                      {paymentMethod === 'GCash' ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-700 font-bold">GCash Number:</span>
                            <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold">09507310062</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('09507310062', 'gcash')}
                              className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Copy GCash Number"
                            >
                              {copiedText === 'gcash' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {copiedText === 'gcash' && <span className="text-[10px] text-emerald-600 font-bold font-sans">Copied!</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Scan the GCash QR code or send to the number above.
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-slate-700 font-bold">BPI Account:</span>
                            <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-bold">0869767995</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('0869767995', 'bpi')}
                              className="p-1 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded transition-colors"
                              title="Copy BPI Account Number"
                            >
                              {copiedText === 'bpi' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            {copiedText === 'bpi' && <span className="text-[10px] text-emerald-600 font-bold font-sans">Copied!</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-normal">
                            Scan the Bank QR code or transfer to the BPI account above.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">GCash / Bank Reference Number</label>
                      <input
                        type="text"
                        placeholder="13-Digit Reference ID..."
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 transition-all font-semibold font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Proof of Payment Screenshot</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProofOfPaymentPreview(URL.createObjectURL(file));
                            toast.success('Payment receipt screenshot attached!');
                          }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                      />
                    </div>
                  </div>

                  {proofOfPaymentPreview && (
                    <div className="bg-white border border-slate-200 p-2 rounded-xl flex items-center justify-center max-w-xs mx-auto">
                      <img 
                        src={proofOfPaymentPreview} 
                        alt="Proof of Payment" 
                        className="max-h-32 object-contain rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-slate-900/10 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Order Stream...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      Submit Order
                    </>
                  )}
                </button>
              </form>
            ) : (
              // SUCCESS SCREEN
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-6 flex flex-col items-center max-w-md mx-auto"
              >
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-full text-emerald-500 mb-2 shadow-sm animate-bounce">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-sans font-black text-2xl text-slate-900 tracking-tight leading-none uppercase">Order Submitted!</h3>
                  <p className="text-emerald-600 font-mono text-[10px] uppercase font-bold tracking-widest leading-none mt-1">Ready for confirmation</p>
                </div>

                <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl w-full text-center">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block font-bold">Your Unique Tracking Number</span>
                  <div className="text-sm font-mono font-black text-slate-900 select-all mt-1.5 flex items-center justify-center gap-1.5 bg-white py-2.5 px-3 rounded-xl border border-slate-200">
                    {submittedOrderId}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                    Copy and use this tracking number in the <strong className="text-sky-600">"Track My Order"</strong> section on our homepage to monitor real-time printing, payment, and delivery status updates.
                  </p>
                </div>

                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  Your order request has been successfully submitted. Please proceed to our Messenger page to confirm your payment and discuss additional order details with our team.
                </p>



                <div className="pt-2 space-y-3 w-full">
                  <a
                    href="https://m.me/Jkmprimedigitalprints"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-sky-500/10 hover:shadow-lg hover:shadow-sky-500/20"
                  >
                    Proceed to Messenger for Payment
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={() => {
                      setIsSubmittedSuccess(false);
                      // Clear form but keep keys
                      setCustomerName('');
                      setContactNumber('');
                      setDeliveryAddress('');
                      setOrderDescription('');
                      setQuantity('1');
                      setAdditionalInstructions('');
                      setUploadedFiles([]);
                      setFilePreviews([]);
                      onClose();
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all cursor-pointer"
                  >
                    Back to Website
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
