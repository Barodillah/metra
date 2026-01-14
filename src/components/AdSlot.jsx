
import React, { useEffect, useRef, useState } from 'react';
import { useAds } from '../context/AdContext';

const AdSlot = ({ className = '', children, adFormat = 'responsive' }) => {
    const { isAdFree } = useAds();
    const bannerRef = useRef(null);
    const [isMobile, setIsMobile] = useState(false);

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // If the user is ad-free, return null to completely remove the element.
    if (isAdFree) {
        return null;
    }

    // Determine which config to use
    // If mobile, force use of rectangle format (per user request) for better visibility/fit?
    // User instruction: "saat tampilan mobile gunakan yg rectangle"
    // So if isMobile is true, we switch to rectangle config regardless of adFormat (unless strictly specified otherwise, but we'll follow the rule).

    let activeFormat = adFormat;
    if (isMobile) {
        activeFormat = 'rectangle';
    }

    const configs = {
        banner: {
            key: '991d2d184e4a37b043935f8fb3298a3b',
            width: 728,
            height: 90
        },
        rectangle: {
            key: '77d06d0717ff8488648f7775c049c5de',
            width: 300,
            height: 250
        }
    };

    // Fallback to rectangle if format is unknown or set to responsive/rectangle
    const adConfig = configs[activeFormat] || configs.rectangle;

    useEffect(() => {
        if (children || !bannerRef.current) return;

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = `${adConfig.height}px`;
        iframe.style.border = '0';
        iframe.style.overflow = 'hidden';
        iframe.scrolling = 'no';

        bannerRef.current.innerHTML = '';
        bannerRef.current.appendChild(iframe);

        const doc = iframe.contentWindow.document;
        doc.open();

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }</style>
            </head>
            <body>
                <script type="text/javascript">
                    atOptions = {
                        'key' : '${adConfig.key}',
                        'format' : 'iframe',
                        'height' : ${adConfig.height},
                        'width' : ${adConfig.width},
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/${adConfig.key}/invoke.js"></script>
            </body>
            </html>
        `;

        doc.write(content);
        doc.close();

        return () => {
            if (bannerRef.current) {
                bannerRef.current.innerHTML = '';
            }
        };
    }, [adConfig.key, adConfig.width, adConfig.height, children]);

    return (
        <div
            className={`bg-slate-800/40 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden group ${className}`}
            style={{ minHeight: children ? 'auto' : `${adConfig.height + 20}px` }}
        >
            {children ? children : (
                <div ref={bannerRef} className="w-full flex justify-center items-center overflow-hidden">
                    <p className="text-xs text-slate-600">Loading Ad...</p>
                </div>
            )}
        </div>
    );
};

export default AdSlot;
