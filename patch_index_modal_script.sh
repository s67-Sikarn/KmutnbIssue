#!/bin/bash
sed -i '/<!-- ส่วนแจ่งเตือนแบบ Toast มุมขวาล่าง -->/i \
    <!-- 3D Map Modal (Reporter) -->\n\
    <div id="modal-3d" class="fixed inset-0 z-[100] bg-black bg-opacity-50 items-center justify-center p-4" style="display: none;">\n\
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col overflow-hidden animate-fade-in relative">\n\
            <div class="px-4 py-3 border-b flex justify-between items-center bg-gray-50">\n\
                <h3 class="text-lg font-semibold text-gray-800">\n\
                    <i class="fas fa-map-marked-alt text-indigo-600 mr-2"></i> Select Location on 3D Map\n\
                </h3>\n\
                <button type="button" onclick="close3DMap()" class="text-gray-400 hover:text-gray-600 transition">\n\
                    <i class="fas fa-times text-xl"></i>\n\
                </button>\n\
            </div>\n\
            \n\
            <!-- 3D Canvas Container -->\n\
            <div id="map-container" class="w-full relative bg-gray-200" style="height: 60vh; min-height: 400px;">\n\
            </div>\n\
            <div class="p-3 bg-gray-100 text-sm text-center text-gray-600 border-t">Hover to highlight. Click on a room to select it. (Mock Data)</div>\n\
        </div>\n\
    </div>\n' Issue/templates/index.html
