// FIXME: Apparently logging a full timestamp that would incorporate not only a time
// but also a date is not what the WSJT-X author deems necessary. Hence for now we
// can only analyze logfiles that are shorter than 24h...
function wsjt_partition_log(text)
{
    // Takes a raw plain text WSJT-X logfile string and returns a hash of the decodes.
    // Hash key is the timestamp, hash value is an array of decodes.
    var ret = {};
    var lines = text.split("\n"); // FIXME: Investiage if other OS use \r\n here.
    for(var i=0, n=lines.length; i<n; i++)
    {
        var line = lines[i];
        var timestamp = line.substr(0,6);
        if( !(timestamp in ret) )
        {
            ret[timestamp] = [];
        }
        var decode = decode_from_line(line);
        ret[timestamp].push(decode);
    }
    return ret;
}


function decode_from_line(line)
{
    // FIXME: We could sanity-check here but since this is js all hope ist lost anyway.
    var message = line.substr(24).trim();

    //test if the last 4 chars are parseable as maidenhead locator
    try{
        var parts = message.split(" ");
        var locator = parts[parts.length-1];

        if(locator.lenght == 4){
            //could be a locator

        }

        console.log(parts);
    }catch(e){
        console.log("Failed to parse maidenhead locator for msg: "+message+" possible locator: "+locator);
    }

    return {
        ts:   line.substr(0, 6),
        snr:  parseInt(line.substr(7,3)),
        //dt:   parseFloat(line.substr(11,4)),
        freq: parseInt(line.substr(16,4)),
        msg:  message
    };
}

function index_partition(p)
{
    // Returns a hash with decode message as key, whole decode object as value.
    var ret = {};
    for(var i=0, n=p.length; i<n; i++)
    {
        var decode = p[i];
        var msg = decode.msg;
        // FIXME: Check here if msg in ret to find replicates due to overdrive.
        ret[msg] = decode;
    }
    return ret;
}

function compare_partitions(p1, p2)
{
    // Compare two partitions, i.e. arrays containing decodes at one particular timestamp.

    p2_index = index_partition(p2);
    for(var i=0, n=p1.length; i<n; i++)
    {
        var msg = p1[i].msg;
        var locator = extract_locator(msg);
        if(locator)
        {
            locators1[locator] = p1[i].snr;
        }
        if(msg in p2_index)
        {
            var snr_delta = p1[i].snr - p2_index[msg].snr;
            if( !(snr_delta in frequency_delta_bins) )
            {
                frequency_delta_bins[snr_delta] = 0;
            }
            frequency_delta_bins[snr_delta] += 1;
        }
    }

    // FIXME: Use set operations to avoid indexing p1.
    p1_index = index_partition(p1);
    for(var i=0, n=p2.length; i<n; i++)
    {
        var msg = p2[i].msg;
        if( !(msg in p1_index) )
        {
            var locator = extract_locator(msg);
            if(locator)
            {
                locators2[locator] = p2[i].snr;
            }
        }
    }
}

function extract_locator(msg)
{
    // Try to extract a locator from a decoded message. Locators are found in the
    // "CQ" transmission as well as in the follow-up response.
    if(msg.startsWith("CQ "))
    {
        var tokens = msg.trim().split(" ");
        if(tokens.length != 3)
        {
            if(tokens[1] == "DX")
            {
                tokens.splice(1,1);
            }
            else
            {
                console.log("Failed to tokenize CQ message: "+msg);
                return null;
            }
        }
        if(tokens[2].length != 4)
        {
            console.log("Failed to extract locator: "+msg);
            return null;
        }
        return tokens[2];
    }
    return null;
}

/*
partitions1 = partition_log(log1);
partitions2 = partition_log(log2);
frequency_delta_bins = {};

// FIXME: Use sensible value (call?) here, just SNR right now
locators1 = {}
locators2 = {}

for(p1 in partitions1)
{
    if(p1 in partitions2)
    {
        compare_partitions(partitions1[p1], partitions2[p1])
    }
    else
    {
        // FIXME: This timestamp is missing from partitions2.
    }

}
console.log(frequency_delta_bins);
console.log(locators1);
console.log(locators2);
// FIXME: Deal with the set partitions2 \ partitions1 here.
*/
