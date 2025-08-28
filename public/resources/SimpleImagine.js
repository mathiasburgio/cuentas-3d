class SimpleImagine{
    constructor({maxWidth=900, maxHeight=900, maxSize=(5 * 1024 * 1024)}={}){
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this.maxSize = maxSize;
    }
    resize({val, maxWidth=null, maxHeight=null, maxSize= null, debug = false, retType=null}){
        if(!maxWidth || maxWidth == null) maxWidth = this.maxWidth;
        if(!maxHeight || maxHeight == null) maxHeight = this.maxHeight;
        if(!maxSize || maxSize == null) maxSize = this.maxSize;

        return new Promise(async (resolve, reject)=>{
            try{
                let _file = null;
                let _base64 = null;
                let _input = null;
                let _type = null;
                let _ext = null;
                let _presize = -1;
                if(typeof val === "string"){//es base64
                    _file = this.base64ToFile(val);
                    _base64 = val;
                    _input = "base64";
                }else{
                    _file = val;
                    _base64 = await this.fileToBase64(val);
                    _input = "file";
                }
                _type = _file.type;
                _ext = _type.substring( _type.lastIndexOf("/") + 1);
                _presize = _file.size;

                if(_file.size > maxSize) throw `El archivo pesa más de ${maxSize}mb.`;

                let canvas = document.createElement("canvas");
                let ctx = canvas.getContext('2d');

                let img = new Image();
                img.onload = () => {
                    if(img.width > maxWidth){
                        let aux = img.height * maxWidth / img.width;
                        canvas.height = aux;
                        canvas.width = maxWidth;
                        ctx.drawImage(img, 0, 0, maxWidth, aux);
                    }else if(img.height > maxHeight){
                        let aux = img.width * maxHeight / img.height;
                        canvas.height = maxHeight;
                        canvas.width = aux;
                        ctx.drawImage(img, 0, 0, aux, maxHeight);
                    }else{
                        canvas.height = img.height;
                        canvas.width = img.width;
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                    }

                    let retBase64 = ctx.canvas.toDataURL(_type);
                    let retFile = this.base64ToFile(retBase64, _file.name);
                    
                    if(debug){
                        console.log({
                            _file,
                            _base64,
                            _input,
                            _type,
                            _ext,
                            _presize,
                            _possize: retFile.size,
                            retBase64, 
                            retFile, 
                        })
                    }

                    if(retType == "file"){
                        resolve( retFile );
                    }else if(retType == "base64"){
                        resolve( retBase64 );
                    }else{
                        if(_input == "file"){
                            resolve( retFile );
                        }else{
                            resolve( retBase64 );
                        }
                    }
                }
                img.src = _base64;
            }catch(err){
                reject(err);
            }
        });
    }
    base64ToFile(base64, name){
        try{
            let ext = base64.split(";")[0].split("/").at(-1);
            let arr = base64.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], name ? name : "image." + ext, {type:mime});
        }catch(err){
            console.error(err);
        }
    }
    fileToBase64(file){
        return new Promise(resolve=>{
            let reader = new FileReader();
            
            reader.onload = function () {
                resolve(reader.result);
            };

            reader.onerror = function (error) {
                console.log('Error: ', error);
                resolve(undefined);
            };
            
            reader.readAsDataURL(file);
        });
    }
    URItoDataURL(src){
        return new Promise((resolve)=>{
			let img = new Image();
			img.onload = () =>{
				let canvas = document.createElement('canvas');
				let ctx = canvas.getContext('2d');
				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);
				resolve(canvas.toDataURL(), img.width, img.height);
			}
			img.src = src;
		});
    }
}